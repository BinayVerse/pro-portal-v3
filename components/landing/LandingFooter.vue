<template>
  <footer>
    <div class="footer-inner">
      <div class="footer-brand">
        <NuxtLink to="/" class="footer-logo">
          <img src="/images/logoWithText.svg" alt="provento.ai" />
        </NuxtLink>
        <p>
          The AI layer that connects enterprise systems to the way people actually work — inside
          Slack, Teams &amp; WhatsApp.
        </p>
      </div>
      <div class="footer-col">
        <h5>Product</h5>
        <button type="button" @click="goToSection('solution')">Features</button>
        <button type="button" @click="goToSection('signals')">AI Signals</button>
        <button type="button" @click="goToSection('how')">How It Works</button>
        <button type="button" @click="goToSection('pricing')">Pricing</button>
        <NuxtLink to="/book-meeting">Book a Demo</NuxtLink>
      </div>
      <div class="footer-col">
        <h5>Solutions</h5>
        <button type="button" @click="goToSection('solution')">Finance &amp; Banking</button>
        <button type="button" @click="goToSection('solution')">Healthcare</button>
        <button type="button" @click="goToSection('solution')">Real Estate</button>
        <button type="button" @click="goToSection('solution')">Legal</button>
        <button type="button" @click="goToSection('solution')">Manufacturing</button>
      </div>
      <div class="footer-col">
        <h5>Company</h5>
        <button type="button" @click="goToSection('team')">About Us</button>
        <button type="button" @click="goToSection('team')">Team</button>
        <button type="button" @click="goToSection('team')">Careers</button>
        <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
        <a href="mailto:contact@provento.ai">Contact</a>
      </div>
    </div>
    <div class="footer-btm">
      <div class="footer-copy">© 2024–2026 Provento.ai. All rights reserved.</div>
      <div class="footer-links">
        <a
          href="https://www.linkedin.com/company/provento-ai/"
          target="_blank"
          rel="noopener noreferrer"
          >LinkedIn</a
        >
        <a href="mailto:contact@provento.ai">Email</a>
        <NuxtLink to="/privacy-policy">Privacy</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return

  const top = el.getBoundingClientRect().top + window.pageYOffset

  window.scrollTo({
    top,
    behavior: 'smooth',
  })
}

async function goToSection(sectionId: string) {
  const currentRoute = router.currentRoute.value.path

  if (currentRoute !== '/') {
    await router.push('/')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  scrollToSection(sectionId)
}
</script>
