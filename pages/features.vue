<template>
  <div>
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span class="text-primary-400">Smart Document Management</span>
          </h1>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how Provento.ai transforms your document workflow with cutting-edge AI
            technology and seamless integrations.
          </p>
        </div>

        <!-- Intelligent Document Conversations -->
        <div class="mb-20">
          <h2 class="text-3xl font-bold text-white mb-12">Intelligent Document Conversations</h2>
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p class="text-gray-300 text-lg mb-8">
                Transform static documents into interactive conversations. Ask questions in natural
                language and get instant, accurate answers from your document library.
              </p>
              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Natural language processing for complex queries</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Context-aware responses with source citations</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Multi-document knowledge synthesis</span>
                </div>
              </div>
            </div>
            <div class="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div class="bg-dark-900 rounded-lg p-4 mb-4">
                <div class="flex items-center space-x-2 mb-3">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div class="space-y-2">
                  <div class="text-gray-300 text-sm">
                    <span class="text-primary-400">User:</span> What are the key risks mentioned in
                    the Q3 financial report?
                  </div>
                  <div class="text-gray-300 text-sm">
                    <span class="text-green-400">Provento.ai:</span> Based on the Q3 financial
                    report, the key risks identified are: 1) Market volatility affecting revenue
                    projections...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seamless Document Upload -->
        <div class="mb-20">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 class="text-xl font-bold text-white mb-6">Supported File Types</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
                    <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                  </div>
                  <span class="text-gray-300">PDF</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                  </div>
                  <span class="text-gray-300">Word</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                  </div>
                  <span class="text-gray-300">CSV</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                    <svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                  </div>
                  <span class="text-gray-300">Markdown</span>
                </div>
              </div>
            </div>
            <div>
              <h2 class="text-3xl font-bold text-white mb-6">Seamless Document Upload</h2>
              <p class="text-gray-300 text-lg mb-8">
                Upload documents from multiple sources with support for all major file formats. Our
                intelligent processing ensures your content is ready for conversations in seconds.
              </p>
              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Manual file upload with drag & drop</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Google Drive integration</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-gray-300">Smart categorization and tagging</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Integrations -->
        <div class="mb-20">
          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
              >
                <svg class="w-8 h-8 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-4">Slack Integration</h3>
              <p class="text-gray-300 mb-6">
                Get document insights directly in your Slack channels. Ask questions and receive
                answers without leaving your workflow.
              </p>
            </div>
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
              >
                <svg class="w-8 h-8 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 12a12 12 0 1 1-24 0 12 12 0 0 1 24 0zm-12-8.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm2.6 5.4c-.4-.8-1-1.3-1.8-1.5-.8-.2-1.7-.1-2.5.3-.8.4-1.3 1-1.5 1.8-.2.8-.1 1.7.3 2.5l2.5 5.2c.2.4.6.6 1 .6s.8-.2 1-.6l2.5-5.2c.4-.8.5-1.7.3-2.5-.2-.8-.7-1.4-1.5-1.8-.2-.1-.4-.1-.3.2zm-1.6 2.1c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-4">Teams Integration</h3>
              <p class="text-gray-300 mb-6">
                Seamlessly connect with Microsoft Teams for collaborative document analysis and
                real-time knowledge sharing.
              </p>
            </div>
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  class="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-4">Mobile Integration</h3>
              <p class="text-gray-300 mb-6">
                Access your documents on WhatsApp and iMessage for on-the-go insights and quick
                document queries.
              </p>
            </div>
          </div>
        </div>

        <!-- Advanced Analytics & Insights -->
        <div class="mb-20">
          <h2 class="text-3xl font-bold text-white text-center mb-6">
            Advanced Analytics & Insights
          </h2>
          <p class="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Track usage patterns, monitor performance, and gain insights into how your team
            interacts with documents.
          </p>
          <div class="grid md:grid-cols-4 gap-8">
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-3">Usage Analytics</h3>
              <p class="text-gray-300 text-sm">
                Track user engagement and common interaction patterns.
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-3">Performance Metrics</h3>
              <p class="text-gray-300 text-sm">Monitor response times and system performance.</p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-3">Trend Analysis</h3>
              <p class="text-gray-300 text-sm">Identify popular documents and query patterns.</p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-3">Custom Reports</h3>
              <p class="text-gray-300 text-sm">Generate detailed reports for stakeholders.</p>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div
          class="text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-12"
        >
          <h2 class="text-3xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
          <p class="text-xl text-gray-300 mb-8">
            Join thousands of teams already using Provento.ai to transform their document workflows.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink to="/book-meeting" class="btn-primary text-lg px-8 py-4">
              Book a Demo
            </NuxtLink>
            <NuxtLink to="/signup" class="btn-outline text-lg px-8 py-4">
              Start Free Trial
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// The default layout will be used automatically

useHead({
  title: 'Features - Provento.ai',
})
</script>
