<template>
  <q-page>
    <transition enter-active-class="animated slideInDown" leave-active-class="animated fadeOut">
      <q-page-sticky position="top-left" :offset="[16, 16]" v-if="!isLoading && isStarted">
        <div class="row items-center bjs-link">
          <q-img
            src="bjs-logo.png"
            spinner-color="white"
            style="height: 64px; width: 64px"
            :class="`col ${isLoading ? '' : 'animated'} flip bjs-logo bjs-link`"
            @click="gotoBabylonSite"
          />
          <div class="text-h6 text-white bjs-link" @click="gotoBabylonSite">Powered by BabylonJS</div>
        </div>
      </q-page-sticky>
    </transition>
    <transition enter-active-class="animated slideInDown" leave-active-class="animated fadeOut">
      <q-page-sticky position="top-right" :offset="[16, 16]" v-if="isStarted">
        <q-btn
          fab
          flat
          color="white"
          @click="toggleFullScreen"
          :disable="!$q.fullscreen.isCapable"
          :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
          :class="$q.fullscreen.isActive ? '' : 'animated infinite heartBeat fullscreenbuttton'"
        />
        <q-btn fab flat icon="pest_control" color="orange" @click="showDebug" class="on-right" />
      </q-page-sticky>
    </transition>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <q-page-sticky v-if="isLoading" position="bottom-left" :offset="[16, 16]"> </q-page-sticky>
    </transition>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
      <div class="absolute-center z-top text-center row" v-if="!isLoading && !isStarted">
        <q-btn label="Audio is playing? let's start in fullscreen!" size="xl" color="green-6" flat @click="start" class="col-12 fullscreenbuttton infinite" />
        <q-btn
          label="Can't hear anything? Retry audio initialization!"
          size="md"
          color="blue-4"
          no-caps
          flat
          @click="audio"
          class="animated heartBeat fullscreenbuttton infinite col-12"
        />
      </div>
      <div class="absolute-center z-top text-h6 text-white q-pa-md" v-if="isLoading">
        Loading, please wait...
      </div>
    </transition>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
      <div class="fixed-bottom-left z-top q-ma-md" v-if="!isLoading && !isStarted && isAudioTested">
        <q-btn label="Run in classic mode" size="md" color="grey-8" flat @click="startClassic" />
      </div>
    </transition>
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <q-page-sticky v-if="!isLoading && isStarted" position="bottom-left" :offset="[16, 16]">
        <q-btn flat :label="isRotation ? 'Unlock camera' : 'Lock camera'" size="xl" style="color:rgb(187,70,75)" @click="toggleRotation" class="on-right" />
        <q-btn
          v-if="false"
          color="white"
          flat
          size="xl"
          label="Toggle coolness"
          @click="toggleStructure"
          class="on-right heartBeat animated infinite fullscreenbuttton"
        />
        <q-btn v-if="!isRotation" flat size="xl" label="Spin Camera" color="grey-5" @click="spinCamera" class="on-right" />
        <q-btn flat label="Hip Hop" color="grey-5" @click="setDanceHipHop2" class="on-right" />
        <q-btn v-if="false" flat label="Hip Hop 2" color="grey-5" @click="setDanceHipHop2" class="on-right" />
      </q-page-sticky>
    </transition>
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <q-page-sticky position="bottom-right" :offset="[16, 16]" v-if="!isStarted">
        <div class="text-h6 text-white">
          <img src="textures/explicit.jpg" alt="Warning! Explicit lyrics!" />
        </div>
      </q-page-sticky>
    </transition>
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <q-page-sticky position="bottom-right" :offset="[16, 16]" v-if="isStarted">
        <div class="text-caption text-grey-7">
          Created by Roland Csibrei, 2021<br />
          Sunglasses 3D model by nazar.sokol (https://skfb.ly/6vA6n)<br />
          Song by K-Maro - Million Dollar Boy<br />
          Intro music by Siddhartha Corsus https://freemusicarchive.org/music/Siddhartha
        </div>
      </q-page-sticky>
    </transition>
    <canvas ref="bjsCanvas" width="1920" height="1080" class="bjs-canvas" />
  </q-page>
</template>

<script lang="ts">
import { Engine } from '@babylonjs/core'
import { defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { DancingMarblesScene } from 'src/scenes/DancingMarblesScene'

export default defineComponent({
  name: 'PageIndex',
  setup(_, { root }) {
    const $q = root.$q
    const bjsCanvas = ref<HTMLCanvasElement | null>(null)
    const isLoading = ref(true)
    const isAudioTested = ref(false)
    const isStarted = ref(false)
    const isTimeForTheShow = ref(false)
    const isRotation = ref(false)
    const isOpen = ref(false)
    let engine: Engine

    let scene: DancingMarblesScene

    onMounted(async () => {
      if (bjsCanvas?.value) {
        scene = new DancingMarblesScene(bjsCanvas.value)
        engine = scene.getEngine()
        await scene.initScene()
        window.addEventListener('resize', onWindowResize)
        // scene.startScene()
        isLoading.value = false

        scene.loadIntroMusic(() => {
          scene.playIntroMusic()
        })
      }
    })

    onUnmounted(() => {
      cleanup()
    })

    const cleanup = () => {
      window.removeEventListener('resize', onWindowResize)
    }

    const gotoBabylonSite = () => {
      window.open('https://www.babylonjs.com', '_blank')
    }
    const setDanceHipHop1 = () => {
      scene.setDanceHipHop1()
    }
    const setDanceHipHop2 = () => {
      scene.setDanceHipHop2()
    }
    const setCamera1 = () => {
      scene.setCamera1()
    }
    const setCamera2 = () => {
      scene.setCamera2()
    }
    const setCamera3 = () => {
      scene.setCamera3()
    }
    const audio = () => {
      scene.playIntroMusic()
      isAudioTested.value = true
    }

    const toggleFullScreen = async () => {
      if ($q.fullscreen.isCapable) {
        await $q.fullscreen.toggle()
      }
    }

    const onWindowResize = () => {
      if (bjsCanvas.value) {
        bjsCanvas.value.width = bjsCanvas.value?.clientWidth
        bjsCanvas.value.height = bjsCanvas.value?.clientHeight
      }
      engine.resize()
    }

    const showDebug = async () => {
      await scene?.showDebug()
    }

    const toggleStructure = () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        showStructure()
      } else {
        hideStructure()
      }
    }
    const showStructure = () => {
      // scene?.showStructure()
    }

    const spinCamera = () => {
      scene.randomCamera(true)
    }
    const hideStructure = () => {
      // scene?.hideStructure()
    }

    const toggleRotation = () => {
      isRotation.value = !isRotation.value
      if (isRotation.value) {
        scene?.startRotation()
      } else {
        scene?.stopRotation()
      }
    }

    const start = async () => {
      if ($q.fullscreen.isCapable) {
        await $q.fullscreen.toggle()
        startClassic()
      }
    }
    const startClassic = () => {
      scene.stopIntroMusic()
      scene.startScene()
      scene.playMusic()

      let opacity = 0
      function fade() {
        if (opacity < 1) {
          opacity += 0.015
          if (opacity < 1) {
            window.requestAnimationFrame(fade)
          }
        }

        if (bjsCanvas.value) {
          bjsCanvas.value.style.opacity = opacity.toPrecision(4)
        }
      }

      window.requestAnimationFrame(fade)

      isStarted.value = true
    }
    return {
      isAudioTested,
      audio,
      start,
      startClassic,
      showStructure,
      hideStructure,
      gotoBabylonSite,
      bjsCanvas,
      toggleFullScreen,
      spinCamera,
      setDanceHipHop1,
      setDanceHipHop2,
      setCamera1,
      setCamera2,
      setCamera3,
      isLoading,
      isStarted,
      showDebug,
      toggleStructure,
      isTimeForTheShow,
      toggleRotation,
      isRotation
    }
  }
})
</script>

<style lang="sass" scoped>
.bjs-canvas
  width: 100%
  height: 100%
  opacity: 0
.bjs-link
  cursor: pointer
.bjs-logo
  --animate-duration: 1.2s
  animation-delay: 10s
.fullscreenbuttton
  --animate-duration: 2s
</style>
