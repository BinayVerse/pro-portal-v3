<template>
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
            Transform your documents into intelligent conversations with AI-powered document chatting platform.
          </p>
          <div class="flex space-x-4">
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.219-.359-1.219c0-1.14.219-1.989.219-1.989s.359.359.719.359c.359 0 .538-.179.538-.538 0-.359-.179-.718-.179-1.078 0-.359.179-.718.538-.718.359 0 .718.359.718.718 0 .359-.179.718-.538 1.078-.359.359-.718.718-.718 1.078 0 .359.359.718.718.718.359 0 .718-.359.718-.718 0-.359-.359-.718-.718-1.078z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Product -->
        <div>
          <h3 class="text-white font-semibold mb-4">Product</h3>
          <ul class="space-y-2">
            <li><NuxtLink to="/features" class="text-gray-400 hover:text-white transition-colors">Features</NuxtLink></li>
            <li><NuxtLink to="/solutions" class="text-gray-400 hover:text-white transition-colors">Solutions</NuxtLink></li>
            <li><NuxtLink to="/pricing" class="text-gray-400 hover:text-white transition-colors">Pricing</NuxtLink></li>
            <li><NuxtLink to="/book-meeting" class="text-gray-400 hover:text-white transition-colors">Book Demo</NuxtLink></li>
          </ul>
        </div>

        <!-- Industries -->
        <div>
          <h3 class="text-white font-semibold mb-4">Industries</h3>
          <ul class="space-y-2">
            <li><NuxtLink to="/solutions/education" class="text-gray-400 hover:text-white transition-colors">Education</NuxtLink></li>
            <li><NuxtLink to="/solutions/finance-banking" class="text-gray-400 hover:text-white transition-colors">Finance & Banking</NuxtLink></li>
            <li><NuxtLink to="/solutions/government" class="text-gray-400 hover:text-white transition-colors">Government</NuxtLink></li>
            <li><NuxtLink to="/solutions/healthcare" class="text-gray-400 hover:text-white transition-colors">Healthcare</NuxtLink></li>
            <li><NuxtLink to="/solutions/insurance" class="text-gray-400 hover:text-white transition-colors">Insurance</NuxtLink></li>
            <li><NuxtLink to="/solutions/legal" class="text-gray-400 hover:text-white transition-colors">Legal</NuxtLink></li>
            <li><NuxtLink to="/solutions/manufacturing" class="text-gray-400 hover:text-white transition-colors">Manufacturing</NuxtLink></li>
            <li><NuxtLink to="/solutions/real-estate" class="text-gray-400 hover:text-white transition-colors">Real Estate</NuxtLink></li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="text-white font-semibold mb-4">Support</h3>
          <ul class="space-y-2">
            <li><NuxtLink to="/faq" class="text-gray-400 hover:text-white transition-colors">FAQ</NuxtLink></li>
            <li><a href="mailto:support@provento.ai" class="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
            <li><NuxtLink to="/book-meeting" class="text-gray-400 hover:text-white transition-colors">Book a Demo</NuxtLink></li>
            <li><a href="mailto:hello@provento.ai" class="text-gray-400 hover:text-white transition-colors">General Inquiries</a></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-dark-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div class="text-gray-400 text-sm">
          © {{ currentYear }} Provento.ai. All rights reserved.
        </div>
        <div class="flex space-x-6 mt-4 md:mt-0">
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = computed(() => new Date().getFullYear())
</script>
