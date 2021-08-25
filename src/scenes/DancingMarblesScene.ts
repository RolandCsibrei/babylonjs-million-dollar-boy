// Million Dollar Boy Demo, Roland Csibrei, 2021

import {
  Animation,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Scene,
  SceneLoader,
  Color4,
  NodeMaterial,
  InputBlock,
  MeshBuilder,
  Plane,
  StandardMaterial,
  MirrorTexture,
  CubeTexture,
  DefaultRenderingPipeline,
  Color3,
  Mesh,
  MeshExploder,
  Texture,
  AbstractMesh,
  PointLight,
  Sound,
  Engine,
  Analyser,
  Vector2,
  DynamicTexture,
  AnimationGroup,
  TransformNode,
  Material,
  CubicEase,
  EasingFunction,
  IAnimationKey,
  Layer
} from '@babylonjs/core'
import '@babylonjs/loaders'

import { moveCameraTo } from 'src/utils/camera'
import { BaseScene } from './BaseScene'

const BASE_URL = 'models/'
const CAMERA_Y = 1.4

interface NmeColor {
  material: NodeMaterial
  color: Color3
  animations: Animation[]
}
interface RigOverride {
  mesh?: Mesh
  size?: number
  scale?: number[]
  color?: Color3
  disable?: boolean
}

export class DancingMarblesScene extends BaseScene {
  private _introMusic?: Sound
  private _music?: Sound
  private _isMusicPlaying = false
  private _audioOk = false
  private _isDancing = false
  private _autoCamera = false
  private _currentRig = ''
  private _timeStart = 0
  private _mul = 1
  private _rigOverrides = new Map<string, RigOverride>()
  private _dome?: Mesh
  private _visualizer?: Mesh

  private _colors: NmeColor[] = []

  private _logo?: Mesh
  private _sunglasses?: TransformNode
  private _rigs = new Map<string, AnimationGroup>()
  private _dAlpha = 0
  private _dBeta = 0.001

  private _domeRotX = -0.0005
  private _domeRotY = 0.0004
  private _domeRotZ = -0.0002

  private _diamondMaterial?: NodeMaterial
  private _domeMaterial?: NodeMaterial
  private _domePieces?: Mesh[]

  private _stopRotation = false
  private _explosion?: MeshExploder
  private _explosionInfo: {
    ratio: number
    animations: Animation[]
    update: boolean
  } = {
    ratio: 0,
    animations: [],
    update: false
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)

    this._rigOverrides.set('mixamorig:Head', { size: 1.8, color: Color3.Blue() })
    this._rigOverrides.set('mixamorig:Spine1', { scale: [2.6, 2.8, 1.8], color: Color3.Red() })
    this._rigOverrides.set('mixamorig:Neck', { disable: true })
    this._rigOverrides.set('mixamorig:Spine', { disable: true })
    this._rigOverrides.set('mixamorig:Spine2', { disable: true })
    this._rigOverrides.set('mixamorig:Spine3', { disable: true })
    this._rigOverrides.set('mixamorig:Hips', { disable: true })

    this._rigOverrides.set('mixamorig:RightShoulder', { disable: true, scale: [0.6, 1.4, 0.2] })
    this._rigOverrides.set('mixamorig:LeftShoulder', { disable: true, scale: [0.6, 1.2, 0.2] })

    this._rigOverrides.set('mixamorig:RightForeArm', { disable: true, size: 0.7 })
    this._rigOverrides.set('mixamorig:LeftForeArm', { disable: true, size: 0.7 })

    this._rigOverrides.set('mixamorig:RightArm', { disable: false, scale: [0.6, 1.4, 1] })
    this._rigOverrides.set('mixamorig:LeftArm', { disable: false, scale: [0.6, 1.4, 1] })

    this._rigOverrides.set('mixamorig:RightHand', { disable: false, scale: [0.4, 1.4, 0.7] })
    this._rigOverrides.set('mixamorig:LeftHand', { disable: false, scale: [0.4, 1.4, 0.7] })

    this._rigOverrides.set('mixamorig:RightLeg', { disable: false, scale: [0.6, 0.6, 0.4], color: Color3.Green() })
    this._rigOverrides.set('mixamorig:LeftLeg', { disable: false, scale: [0.6, 0.6, 0.4], color: Color3.Green() })

    this._rigOverrides.set('mixamorig:RightUpLeg', { disable: false, scale: [0.6, 1.4, 1], color: Color3.Yellow() })
    this._rigOverrides.set('mixamorig:LeftUpLeg', { disable: false, scale: [0.6, 1.4, 1], color: Color3.Yellow() })

    this._rigOverrides.set('mixamorig:RightFoot', { disable: false, scale: [0.6, 0.7, 1.8], color: Color3.Gray() })
    this._rigOverrides.set('mixamorig:LeftFoot', { disable: false, scale: [0.6, 0.7, 1.8], color: Color3.Gray() })

    this._rigOverrides.set('mixamorig:RightToeBase', { disable: true })
    this._rigOverrides.set('mixamorig:LeftToeBase', { disable: true })
    this._rigOverrides.set('mixamorig:RightToe_End', { disable: true })
    this._rigOverrides.set('mixamorig:LeftToe_End', { disable: true })
    this._rigOverrides.set('mixamorig:HeadTop_End', { disable: true })
  }

  createCamera() {
    const camera = new ArcRotateCamera('camera1', 4.14, 0.67, 120, new Vector3(0, CAMERA_Y, 0), this._scene)
    camera.attachControl(this._canvas, true)
    // camera.inertia = 0.8
    // camera.speed = 0.05
    camera.minZ = 0.001
    camera.maxZ = 500
    camera.lowerBetaLimit = -1.65
    camera.upperBetaLimit = 1.65
    camera.lowerRadiusLimit = 3
    camera.upperRadiusLimit = 1600
    camera.angularSensibilityX = 2000
    camera.angularSensibilityY = 2000
    camera.panningSensibility = 3000
    // camera.pinchDeltaPercentage = 0.2
    camera.wheelDeltaPercentage = 0.1
    camera.speed = 0.05

    this._camera = camera

    this.setCamera0()
  }

  private async _loadAnims() {
    const loaded = await SceneLoader.ImportMeshAsync('', BASE_URL, 'dancer.glb')
    const animGroups = loaded.animationGroups
    animGroups.forEach(ag => {
      ag.stop()
      ag.targetedAnimations.forEach(ta => {
        ta.animation.enableBlending = true
        ta.animation.blendingSpeed = 0.05
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const targetName = <string>ta.target['name']
        const newTarget = this._scene.transformNodes.find(tn => tn.name === targetName)
        ta.target = newTarget
      })
      this._rigs.set(ag.name, ag)
    })

    const newRoot = new TransformNode('dancer', this._scene)
    const prefabName = 'HappyIdle'
    const prefabParent = loaded.transformNodes.find(t => t.name === prefabName)
    if (prefabParent) {
      newRoot.position.y = -0.4
      prefabParent.parent = newRoot
    }

    const root = loaded.meshes[0]
    root?.dispose()
  }

  private _updateDiamondColorInMaterial(material: NodeMaterial, color: Color3) {
    const baseColorBlock = <InputBlock>material.getBlockByName('baseColor')
    baseColorBlock.value = color
  }

  private _getDiamondColorInMaterial(material: NodeMaterial) {
    const baseColorBlock = <InputBlock>material.getBlockByName('baseColor')
    const color = <Color3>baseColorBlock.value
    return color
  }

  private _enableBloom(scene: Scene) {
    const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, scene.cameras)
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.85
    pipeline.bloomWeight = 0.25
    pipeline.bloomKernel = 5
    pipeline.bloomScale = 0.05
    pipeline.imageProcessingEnabled = false
    pipeline.fxaaEnabled = true
    pipeline.samples = 3

    pipeline.depthOfFieldEnabled = true
    pipeline.depthOfField.focalLength = 4
    pipeline.depthOfField.fStop = 1.4
    pipeline.depthOfField.focusDistance = 200
    pipeline.depthOfField.lensSize = 50

    pipeline.depthOfField.focalLength = 23.6
    pipeline.depthOfField.fStop = 11.5
    pipeline.depthOfField.focusDistance = 155
    pipeline.depthOfField.lensSize = 50

    pipeline.chromaticAberrationEnabled = true
    pipeline.chromaticAberration.aberrationAmount = 10.9
    pipeline.chromaticAberration.radialIntensity = 0.13

    pipeline.imageProcessingEnabled = true
    pipeline.imageProcessing.contrast = 4
    pipeline.imageProcessing.exposure = 0.8
  }

  private async _createDemo(scene: Scene) {
    const snippetId = 'KIUSWC#69'
    const snippetIdDome = 'KIUSWC#72'

    const matBigDiamond = await NodeMaterial.ParseFromSnippetAsync(snippetId, scene)
    matBigDiamond.name = 'diamond'
    const matDome = await NodeMaterial.ParseFromSnippetAsync(snippetIdDome, scene)
    this._diamondMaterial = matBigDiamond
    const domeMaterial = matDome
    matDome.name = 'dome'
    this._domeMaterial = domeMaterial

    const color = new Color3(1, 1, 1)
    this._updateDiamondColorInMaterial(matBigDiamond, color)

    const layer = new Layer('', 'textures/stars-2.jpg', this._scene, true)

    await this._loadAnims()
    await this._loadSunglasses()
    console.log(this._sunglasses)
    this._domePieces = <Mesh[]>await this._loadDome()
    // await this._loadBJSLogo()

    const animName = 'HappyIdle'
    this._rigFigure(animName)
    this._createAnalyzer()
    this._createMirror()
    const anim = this._rigs.get(animName)
    if (anim && anim instanceof AnimationGroup) {
      anim.play(true)
    }

    let betaPlus = 0.002

    let newColors = 100
    let newCamera = 1200
    this._scene.onBeforeRenderObservable.add(() => {
      const ticks = this._timeStart - Date.now()

      const makeCoolColors = --newColors < 0
      if (makeCoolColors) {
        newColors = 100
        this._randomDomeColors()
      }

      const makeCoolRotation = --newCamera < 0
      if (makeCoolRotation && this._isDancing) {
        newCamera = 1200
        this.randomCamera()
      }

      if (ticks < -10032 && this._currentRig === '') {
        this.setDanceHipHop1()
      }
      // if (ticks < -18032) {
      //   this.dance2()
      // }
      // if (ticks < -28032) {
      //   this.dance3()
      // }

      const arcCamera = <ArcRotateCamera>this._camera
      arcCamera.alpha += this._dAlpha
      arcCamera.beta += this._dBeta
      if (arcCamera.beta > 1.82) {
        betaPlus = -betaPlus
      }
      if (arcCamera.beta > 0.62) {
        betaPlus = -betaPlus
      }
    })

    this._loadMusic()
  }

  public isAudio() {
    return this._audioOk
  }

  private _createAnalyzer() {
    if (Engine.audioEngine) {
      const analyser = new Analyser(this._scene)
      Engine.audioEngine.connectToAnalyser(analyser)
      analyser.BARGRAPHAMPLITUDE = 256
      analyser.FFT_SIZE = 64
      analyser.SMOOTHING = 0.7

      analyser.DEBUGCANVASPOS = new Vector2(window.innerWidth, window.innerHeight)
      analyser.drawDebugCanvas()

      const visualizeCanvas = document.getElementsByTagName('canvas')[1]

      const visualizer = Mesh.CreateGround('visualizer', 23, 23, 1)
      visualizer.rotation.x = Math.PI
      visualizer.rotation.y = Math.PI
      visualizer.position.y = 18
      const visualizerTexture = new DynamicTexture('visualizer', visualizeCanvas)
      const material = new StandardMaterial('visualizer', this._scene)
      material.emissiveTexture = visualizerTexture
      visualizer.material = material
      this._visualizer = visualizer
      this._visualizer.isVisible = false
      material.disableLighting = true

      const lightColumns = this._domePieces?.length ?? 0
      this._scene.onBeforeRenderObservable.add(() => {
        const frequencies = analyser.getByteFrequencyData()
        // let sum = 0
        for (let i = 0; i < lightColumns; i++) {
          const normalizedFrequency = frequencies[i] / 255
          //
        }

        visualizerTexture.update()
      })
    } else {
      console.error('No audio engine.')
    }
  }

  private _createMirror() {
    const ground = MeshBuilder.CreateGround('ground', { width: 16, height: 16 }, this._scene)
    const ground2 = MeshBuilder.CreateGround('ground2', { width: 16, height: 16 }, this._scene)
    // const ground2 = MeshBuilder.CreateBox('ground2', { width: 16, height: 1, depth: 16 }, this._scene)
    // const ground = MeshBuilder.CreateCylinder('ground', { tessellation: 6, height: 0.4, diameter: 16, backUVs:  })
    // this._danceFloor = ground

    ground.position = new Vector3(0, -1, 0)
    ground2.position = new Vector3(0, -1.4, 0)
    ground.alphaIndex = 0
    ground2.alphaIndex = 0

    ground.computeWorldMatrix(true)
    const groundWorldMatrix = ground.getWorldMatrix()

    const groundVertexData = ground.getVerticesData('normal')
    const mirrorMaterial = new StandardMaterial('mirror', this._scene)
    mirrorMaterial.emissiveColor = new Color3(0, 0, 0.03)
    mirrorMaterial.backFaceCulling = false
    const reflectionTexture = new MirrorTexture('mirror', 1024, this._scene, true)
    const reflectionTextureRenderList = reflectionTexture.renderList ?? []
    if (groundVertexData) {
      const groundNormal = Vector3.TransformNormal(new Vector3(groundVertexData[0], groundVertexData[1], groundVertexData[2]), groundWorldMatrix)

      const reflector = Plane.FromPositionAndNormal(ground.position, groundNormal.scale(-1))
      mirrorMaterial.reflectionTexture = reflectionTexture
      reflectionTexture.adaptiveBlurKernel = 16
      reflectionTexture.mirrorPlane = reflector

      const pieces = this._scene.meshes.filter(m => m.name.includes('cell'))
      pieces.forEach(p => {
        reflectionTextureRenderList.push(p)
      })

      const bodyParts = this._scene.meshes.filter(m => m.name.includes('body'))
      bodyParts.forEach(p => {
        reflectionTextureRenderList.push(p)
      })

      if (this._visualizer) {
        reflectionTextureRenderList.push(this._visualizer)
      }

      mirrorMaterial.reflectionTexture.level = 1
      mirrorMaterial.disableLighting = true
      mirrorMaterial.alpha = 0.94
      ground.material = mirrorMaterial

      const danceFloorTexture = new Texture('textures/HexagonGrid-inverted.png', this._scene)
      mirrorMaterial.emissiveTexture = danceFloorTexture
      danceFloorTexture.uScale = 2
      danceFloorTexture.vScale = 2
      danceFloorTexture.level = 0.6

      const material2 = new StandardMaterial('ground2', this._scene)
      material2.alpha = 0.6
      material2.emissiveTexture = danceFloorTexture
      material2.disableLighting = true
      ground2.material = material2
    }
  }

  private _rigFigure(rigName: string) {
    const parent = this._scene.getTransformNodeByName(rigName)
    if (parent) {
      const riggedParts = parent.getChildTransformNodes().filter(n => n.name.startsWith('mixamorig:'))
      riggedParts.forEach(rp => {
        this._rigPart(riggedParts, rp.name)
      })
    }

    const bone = this._scene.getTransformNodeByName('mixamorig:Head')
    if (this._sunglasses) {
      this._sunglasses.parent = bone
    }
    const discoLight = new PointLight('lightdisco', new Vector3(0, 0, 0), this._scene)
    discoLight.parent = bone
    discoLight.intensity = 10
    discoLight.diffuse = new Color3(0, 0, 1)

    const bone2 = this._scene.getTransformNodeByName('mixamorig:Spine1')
    if (this._logo) {
      const logoParent = this._logo.parent
      if (logoParent) {
        logoParent.parent = bone2
      }
    }
    const discoLight2 = new PointLight('lightdisco2', new Vector3(0, 0, 0), this._scene)
    discoLight2.parent = bone2
    discoLight2.intensity = 3
    discoLight2.diffuse = new Color3(1, 0, 0)

    const bone3 = this._scene.getTransformNodeByName('mixamorig:RightUpLeg')
    const discoLight3 = new PointLight('lightdisco3', new Vector3(0, 0, 0), this._scene)
    discoLight3.parent = bone3
    discoLight3.intensity = 0.4
    discoLight3.diffuse = new Color3(1, 1, 0)

    const bone4 = this._scene.getTransformNodeByName('mixamorig:LeftUpLeg')
    const discoLight4 = new PointLight('lightdisco4', new Vector3(0, 0, 0), this._scene)
    discoLight4.parent = bone4
    discoLight4.intensity = 0.4
    discoLight4.diffuse = new Color3(1, 1, 0)

    const bone5 = this._scene.getTransformNodeByName('mixamorig:RightLeg')
    const discoLight5 = new PointLight('lightdisco5', new Vector3(0, 0, 0), this._scene)
    discoLight5.parent = bone5
    discoLight5.intensity = 0.4
    discoLight5.diffuse = new Color3(0, 1, 0)

    const bone6 = this._scene.getTransformNodeByName('mixamorig:LeftLeg')
    const discoLight6 = new PointLight('lightdisco6', new Vector3(0, 0, 0), this._scene)
    discoLight6.parent = bone6
    discoLight6.intensity = 0.4
    discoLight6.diffuse = new Color3(0, 1, 0)
  }

  private _rigPart(bones: TransformNode[], boneName: string, meshName?: string) {
    const bone = bones.find(b => b.name === boneName)
    if (!bone) {
      console.log('Unable to rig', boneName, meshName)
      return
    }

    const override = this._rigOverrides.get(boneName)
    let mesh: AbstractMesh | null = null

    if (override?.disable !== true) {
      if (meshName) {
        mesh = this._scene.getMeshByName(meshName)
      } else {
        mesh = this._createDefaultMesh(boneName)
      }
      if (override?.size && mesh) {
        mesh.scaling = new Vector3(override.size, override.size, override.size)
      }
      if (override?.scale && mesh) {
        mesh.scaling = new Vector3(override.scale[0], override.scale[1], override.scale[2])
      }
      let material = this._diamondMaterial
      if (override?.color) {
        const clonedMaterial = this._diamondMaterial?.clone(boneName)
        if (clonedMaterial) {
          this._updateDiamondColorInMaterial(clonedMaterial, override.color)
          material = clonedMaterial
        }
      }

      if (mesh && bone) {
        mesh.parent = bone
        if (material) {
          material.maxSimultaneousLights = 16
          mesh.material = material
        }
      } else {
        console.warn("Couldn't rig", boneName, meshName)
      }
    }
    return mesh
  }

  private _loadMusic() {
    const music = new Sound(
      'music',
      'audio/music.mp3',
      this._scene,
      () => {
        this._audioOk = true
      },
      { loop: false, autoplay: false }
    )
    this._music = music
  }

  public loadIntroMusic(callback: () => void) {
    const introMusic = new Sound(
      'music',
      'audio/intro-music.mp3',
      this._scene,
      () => {
        this._introMusic = introMusic
        callback()
      },
      { loop: false, autoplay: false }
    )
  }

  public playIntroMusic() {
    this._introMusic?.play()
  }

  public stopIntroMusic() {
    this._introMusic?.stop()
  }

  public playMusic() {
    if (this._isMusicPlaying) {
      return
    }
    this._isMusicPlaying = true
    this._music?.play()
  }

  public stopMusic() {
    this._music?.stop()
  }

  public startScene() {
    this.setupRenderLoop()
    this.playMusic()
    this._timeStart = Date.now()
  }

  // public fadeOutIntroMusic() {
  //   let volume = this._introMusic?.getVolume() ?? 1
  //   setInterval(() => {
  //     volume -= 0.1
  //     this._introMusic?.setVolume(volume)
  //     if (volume < 0) {
  //       clearInterval()
  //     }
  //   }, 100)
  // }

  private _createDefaultMesh(boneName: string) {
    const mesh1 = Mesh.CreateIcoSphere(`bodypart-${boneName}`, { radius: 32 }, this._scene)
    const mesh2 = Mesh.CreateIcoSphere(`bodypart-${boneName}`, { radius: 31.8 }, this._scene)
    mesh2.rotation = new Vector3(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
    const mesh = Mesh.MergeMeshes([mesh1, mesh2])
    return mesh
  }

  createLight(scene: Scene) {
    const light = new HemisphericLight('lighthemisrt8:-D', new Vector3(1, 1, 0), scene)
    light.intensity = 1

    const hdrTexture = CubeTexture.CreateFromPrefilteredData('env/decor-shop.env', scene)
    scene.environmentTexture = hdrTexture

    scene.clearColor = new Color4(0, 0, 0, 1)
  }

  public async initScene() {
    this._scene.clearColor = new Color4(0, 0, 0, 1)
    this.createCamera()
    this.createLight(this._scene)

    this._enableBloom(this._scene)

    // // glow layer
    // const gl = new GlowLayer('glowLayer', this._scene, {
    //   mainTextureFixedSize: 2048,
    //   blurKernelSize: 16
    // })
    // gl.intensity = 0.4

    await this._createDemo(this._scene)
  }

  public setDanceHipHop1() {
    this._dAlpha = 0.006
    this._domeRotX = 0.005
    this._domeRotY = 0.004
    this._domeRotZ = 0.002

    const arcCamera = <ArcRotateCamera>this._camera
    arcCamera.upperRadiusLimit = 16

    this.setCamera3()

    if (this._visualizer) {
      this._visualizer.isVisible = true
    }

    if (this._dome) {
      this._dome.isVisible = true
    }

    this._domePieces?.forEach(p => {
      p.isVisible = true
    })

    const animCurrent = this._rigs.get('BreakDanceReady')
    if (animCurrent && animCurrent instanceof AnimationGroup) {
      // animCurrent.syncAllAnimationsWith(null)

      animCurrent.animatables.forEach(a => {
        // a.syncWith(null)
        a.stop()
      })
    }

    const anim = this._rigs.get('HipHopDance1')
    this._currentRig = 'HipHopDance1'
    if (anim && anim instanceof AnimationGroup) {
      console.log('HipHop1')
      if (animCurrent) {
        anim.syncAllAnimationsWith(animCurrent.animatables[0])
      }
      anim.play(true)
    }
  }

  public setDanceHipHop2() {
    this._dAlpha = 0.0008
    this._domeRotX = 0.005
    this._domeRotY = -0.004
    this._domeRotZ = 0.001

    const animCurrent = this._rigs.get(this._currentRig)

    const anim = this._rigs.get('HipHopDance2')
    this._currentRig = 'HipHopDance2'

    if (anim && anim instanceof AnimationGroup) {
      if (animCurrent && animCurrent instanceof AnimationGroup) {
        anim.syncAllAnimationsWith(animCurrent.animatables[0])
      }
      anim.play(true)
      console.log('HipHop2')
    }
  }

  public dance3() {
    this._dAlpha = -0.0006
    this._domeRotX = -0.0015
    this._domeRotY = 0.001
    this._domeRotZ = 0.0012

    this.setCamera2()

    const animCurrent = this._rigs.get(this._currentRig)
    if (animCurrent && animCurrent instanceof AnimationGroup) {
      animCurrent.stop()
    }

    const anim = this._rigs.get('BreakDanceEnd2')
    this._currentRig = 'BreakDanceEnd2'

    if (anim && anim instanceof AnimationGroup) {
      anim.play(true)
    }
  }

  public startRotation() {
    this._dAlpha = 0.0008
    this._domeRotX = 0.005
    this._domeRotY = -0.004
    this._domeRotZ = 0.001
    this._autoCamera = true
  }
  public stopRotation() {
    this._dAlpha = 0
    this._domeRotX = -0.0005
    this._domeRotY = 0.0001
    this._domeRotZ = 0.0002
    this._autoCamera = false
  }

  private _randomDomeColors() {
    this._domePieces?.forEach(p => {
      const mat = <NodeMaterial>p.material
      if (mat) {
        this._animateColor(mat)
      }
    })
  }

  private _animateColor(material: NodeMaterial) {
    const colorInfo = this._colors.find(c => c.material.name === material.name)
    if (colorInfo) {
      const ease = new CubicEase()
      ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT)

      const fromColor = this._getDiamondColorInMaterial(material)
      const toColor = new Color3(Math.random(), Math.random(), Math.random())

      const speed = 1
      const frameCount = 60
      const anim = new Animation(`colorAnim-${material.name}`, 'color', frameCount, Animation.ANIMATIONTYPE_COLOR3)

      const keyFrames: IAnimationKey[] = []

      keyFrames.push({
        frame: 0,
        value: fromColor
      })

      keyFrames.push({
        frame: frameCount,
        value: toColor
      })

      anim.setKeys(keyFrames)

      colorInfo.animations.push(anim)

      this._scene.beginAnimation(colorInfo, 0, frameCount, false, speed, () => {
        //
      })
    }
  }

  public randomCamera(force = false) {
    if (!this._autoCamera && !force) {
      console.log('Random camera request dropped')
      return
    }
    this._mul = -this._mul
    const alpha = Math.random() * Math.PI * 2 + Math.PI * this._mul
    const beta = Math.random() * 1.5 + 0.1 + Math.PI * this._mul
    const radius = Math.random() * 10 + 6
    const target = new Vector3(0.1, 1.33, -0.24)
    console.log('Random camera', alpha, beta, radius, target)
    this._animateCamera(alpha, beta, radius, target, 60, 120)
  }

  public setCamera0() {
    const alpha = 2.18
    const beta = 0.91
    const radius = 6.6
    const target = new Vector3(0.1, 1.33, -0.24)
    this._animateCamera(alpha, beta, radius, target, 60, 420)
  }

  public setCamera1() {
    const alpha = 4.14
    const beta = 0.67
    const radius = 9
    const target = new Vector3(0, CAMERA_Y, 0.12)
    this._animateCamera(alpha, beta, radius, target)
  }

  public setCamera2() {
    const alpha = 0
    const beta = 0.08
    const radius = 16
    const target = new Vector3(0, CAMERA_Y, 0.12)
    this._animateCamera(alpha, beta, radius, target)
  }

  public setCamera3() {
    const alpha = -0.49 - Math.PI
    const beta = 0.89
    const radius = 15
    const target = new Vector3(0, CAMERA_Y, 0)
    this._animateCamera(alpha, beta, radius, target)
    setTimeout(() => {
      this._isDancing = true
      // this._autoCamera = true
    }, 2000)
  }

  private _animateCamera(alpha: number, beta: number, radius: number, target?: Vector3, speed = 60, frames = 60) {
    const arcCamera = <ArcRotateCamera>this._camera
    moveCameraTo(arcCamera, null, target, alpha, beta, radius, speed, frames)
  }

  private async _loadSunglasses() {
    const loaded = await SceneLoader.ImportMeshAsync('', BASE_URL, 'sunglasses.glb', this._scene)
    const root = loaded.meshes.find(m => m.name === '__root__')
    if (root) {
      root.name = 'sunglasses'
      root.rotation = new Vector3(0, Math.PI - 0.2, 0)
      const s = 7.6
      root.scaling = new Vector3(s, s, s)
      root.position = new Vector3(0, 0, -3.3)
    }
    this._sunglasses = root
    return root
  }

  private async _loadBJSLogo() {
    const loaded = await SceneLoader.ImportMeshAsync('', BASE_URL, 'bjs-logo.glb', this._scene)
    const root = loaded.meshes.find(m => m.name === '__root__')
    if (root) {
      root.name = 'bjs-logo'
      root.rotation = new Vector3(Math.PI / 2, 0, 0)
      const s = 160
      root.scaling = new Vector3(s, s, s)
      root.position = new Vector3(0, 0, -58)
    }
    this._logo = <Mesh>loaded.meshes[1]
    if (this._logo.material) {
      this._logo.material.alphaMode = Engine.ALPHA_COMBINE
      this._logo.material.transparencyMode = Material.MATERIAL_ALPHATEST
    }
    return root
  }

  private async _loadDome() {
    const loaded = await SceneLoader.ImportMeshAsync('', BASE_URL, 'disco-dome.glb', this._scene)
    const meshes = loaded.meshes
    const root = loaded.meshes.find(m => m.name === '__root__')
    if (root) {
      root.name = 'dome'
      root.rotation = new Vector3(0, 0, 0)
      this._dome = <Mesh>root
      root.isVisible = false
    }
    this._colors.length = 0
    meshes.forEach(m => {
      // m.setParent(null)
      m.alphaIndex = 1

      if (this._domeMaterial) {
        const pieceMaterial = this._domeMaterial.clone(m.name)
        const seed = Math.random()
        const r = 0.4 + seed * 0.6
        const g = 0.3
        const b = 1.0 - seed * 0.3
        const color = new Color3(r, g, b)
        this._updateDiamondColorInMaterial(pieceMaterial, color)
        this._colors.push({ material: pieceMaterial, color, animations: [] })
        m.material = pieceMaterial
        m.isVisible = false
      }
    })

    this._explosion = new MeshExploder(<Mesh[]>meshes)
    this._explosion.explode(0.3)

    //

    this._scene.onBeforeRenderObservable.add(() => {
      if (root) {
        root.rotation.x += this._domeRotX
        root.rotation.y += this._domeRotY
        root.rotation.z += this._domeRotZ
      }

      this._colors.forEach(ci => {
        this._updateDiamondColorInMaterial(ci.material, ci.color)
      })
    })

    return meshes
  }
}
