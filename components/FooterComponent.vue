<template>
  <footer class="bg-dark-950 border-t border-dark-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-4 gap-8">
        <!-- Company Info -->
        <div class="col-span-1">
          <NuxtLink to="/" class="flex items-center space-x-3 mb-4">
            <img src="~/assets/media/logo.svg" alt="Provento Logo" class="w-8 h-8" />
            <span class="text-white text-xl font-semibold">provento.ai</span>
          </NuxtLink>
          <p class="text-gray-400 text-sm mb-4">
            Transform your artifacts into intelligent conversations with AI-powered Artifact
            chatting platform.
          </p>
        </div>

        <!-- Product -->
        <div>
          <h3 class="text-white font-semibold mb-4">Product</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/features" class="text-gray-400 hover:text-white transition-colors"
                >Features</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/solutions" class="text-gray-400 hover:text-white transition-colors"
                >Solutions</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/pricing" class="text-gray-400 hover:text-white transition-colors"
                >Pricing</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/book-meeting" class="text-gray-400 hover:text-white transition-colors"
                >Book a Demo</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Industries -->
        <div>
          <h3 class="text-white font-semibold mb-4">Industries</h3>
          <ul class="space-y-2">
            <li v-for="industry in industries" :key="industry.slug">
              <NuxtLink
                :key="industry.slug"
                :to="industry.slug ? `/solutions/${industry.slug}` : '/solutions'"
                class="text-gray-400 hover:text-white transition-colors"
                >{{ industry.name }}</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="text-white font-semibold mb-4">Support</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/faq" class="text-gray-400 hover:text-white transition-colors"
                >FAQ</NuxtLink
              >
            </li>
            <li>
              <a
                href="mailto:contact@provento.ai"
                class="text-gray-400 hover:text-white transition-colors"
                >Contact Support</a
              >
            </li>
            <li>
              <NuxtLink to="/book-meeting" class="text-gray-400 hover:text-white transition-colors"
                >Book a Demo</NuxtLink
              >
            </li>
            <li>
              <a
                href="mailto:hello@provento.ai"
                class="text-gray-400 hover:text-white transition-colors"
                >General Inquiries</a
              >
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="border-t border-dark-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
      >
        <div class="text-gray-400 text-sm">
          © {{ currentYear }} provento.ai. All rights reserved.
        </div>
        <div class="flex space-x-6 mt-4 md:mt-0">
          <NuxtLink
            to="/privacy-policy"
            class="text-gray-400 hover:text-white transition-colors text-sm"
            >Privacy Policy</NuxtLink
          >
          <NuxtLink
            to="/terms-of-service"
            class="text-gray-400 hover:text-white transition-colors text-sm"
            >Terms of Service</NuxtLink
          >
          <NuxtLink
            to="/cookie-policy"
            class="text-gray-400 hover:text-white transition-colors text-sm"
            >Cookie Policy</NuxtLink
          >
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = computed(() => new Date().getFullYear())
</script>
