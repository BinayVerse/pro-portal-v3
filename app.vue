<template>
  <div class="min-h-screen bg-black">
    <!-- Header Navigation -->
    <header class="bg-black border-b border-dark-700 sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and brand -->
          <NuxtLink to="/" class="flex items-center space-x-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
              alt="Provento Logo"
              class="w-8 h-8"
            />
            <span class="text-white text-xl font-semibold">provento.ai</span>
          </NuxtLink>

          <!-- Main Navigation -->
          <div class="hidden md:flex items-center space-x-8">
            <NuxtLink
              to="/"
              class="text-gray-300 hover:text-white transition-colors duration-200"
              :class="{ 'text-primary-400': $route.name === 'index' }"
            >
              Home
            </NuxtLink>
            <NuxtLink
              to="/features"
              class="text-gray-300 hover:text-white transition-colors duration-200"
              :class="{ 'text-primary-400': $route.name === 'features' }"
            >
              Features
            </NuxtLink>

            <!-- Solutions with dropdown -->
            <div class="relative">
              <button
                class="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                :class="{ 'text-primary-400': $route.path.includes('/solutions') }"
              >
                Solutions
                <svg
                  class="ml-1 w-4 h-4 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
            </div>

            <NuxtLink
              to="/pricing"
              class="text-gray-300 hover:text-white transition-colors duration-200"
              :class="{ 'text-primary-400': $route.name === 'pricing' }"
            >
              Pricing
            </NuxtLink>
            <NuxtLink
              to="/faq"
              class="text-gray-300 hover:text-white transition-colors duration-200"
              :class="{ 'text-primary-400': $route.name === 'faq' }"
            >
              FAQ
            </NuxtLink>
          </div>

          <!-- Right side buttons -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/book-meeting" class="btn-outline hidden sm:inline-flex">
              Book a Meeting
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Login
            </NuxtLink>
            <NuxtLink to="/signup" class="btn-primary"> Sign Up </NuxtLink>
          </div>

          <!-- Mobile menu button -->
          <button class="md:hidden text-gray-300 hover:text-white p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main>
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="bg-dark-950 border-t border-dark-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="col-span-1">
            <NuxtLink to="/" class="flex items-center space-x-3 mb-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
                alt="Provento Logo"
                class="w-8 h-8"
              />
              <span class="text-white text-xl font-semibold">provento.ai</span>
            </NuxtLink>
            <p class="text-gray-400 text-sm mb-4">
              Transform your documents into intelligent conversations with AI-powered document
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
                  href="mailto:support@provento.ai"
                  class="text-gray-400 hover:text-white transition-colors"
                  >Contact Support</a
                >
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="text-white font-semibold mb-4">Company</h3>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors"
                  >Privacy Policy</a
                >
              </li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white transition-colors"
                  >Terms of Service</a
                >
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div
          class="border-t border-dark-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <div class="text-gray-400 text-sm">© 2024 Provento.ai. All rights reserved.</div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Navigation and footer are now directly embedded in app.vue
</script>
