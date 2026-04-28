<template>
  <div>
    <!-- ═══ HERO ═══ -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="hero-glow2"></div>
      <div class="hero-inner">
        <div>
          <div class="hero-kicker fi">Conversational AI for Every Application</div>
          <h1 class="fi d1">
            One <span class="teal">AI Layer.</span><br />Every System.<br />Your
            <span class="gold">Channel.</span>
          </h1>
          <p class="hero-sub fi d2">
            Enterprise teams waste <strong>60+ minutes daily</strong> app-switching and hunting for
            information. Provento.ai connects your ERP, HRMS, CRM and artifacts to
            <strong>Slack, Teams & WhatsApp</strong> — so your people get answers without leaving
            their chat.
          </p>
          <div class="btn-row fi d3">
            <NuxtLink to="/book-meeting" class="btn-primary">Book a Demo</NuxtLink>
            <button type="button" class="btn-ghost" @click="scrollToSection('solution')">
              See How It Works →
            </button>
          </div>
          <div class="hero-stats fi d4">
            <div class="hstat">
              <span class="hstat-n">$8K</span>
              <div class="hstat-l">lost per employee/yr</div>
            </div>
            <div class="hstat-divider"></div>
            <div class="hstat">
              <span class="hstat-n">87M</span>
              <div class="hstat-l">workers affected in US</div>
            </div>
            <div class="hstat-divider"></div>
            <div class="hstat">
              <span class="hstat-n">9%</span>
              <div class="hstat-l">of the workday lost</div>
            </div>
          </div>
        </div>
        <div class="hero-mockup fi d3">
          <!-- Signal float cards -->
          <div class="sig-float" style="bottom: -35px; left: -15px; max-width: 200px">
            <div class="sig-dot"></div>
            <div class="sig-txt">
              <strong>Signal to CHRO</strong>John Doe hasn't taken PTO in 6 months — potential
              burnout risk
            </div>
          </div>
          <div class="sig-float sig-float2" style="bottom: -14px; right: -20px; max-width: 210px">
            <div class="sig-dot"></div>
            <div class="sig-txt">
              <strong>Signal to CPO</strong>ERP, CRM & Stripe licenses expire in 60 days
            </div>
          </div>
          <!-- Main chat card -->
          <div class="mock-card">
            <div class="mock-topbar">
              <div class="mock-channel">
                <div class="mock-ch-icon">
                  <img src="/images/logo.svg" alt="provento.ai" style="height: 32px; width: 32px" />
                </div>
                <span style="font-size: 0.72rem; color: var(--muted)"><span>provento</span></span>
              </div>
              <div class="mock-dots">
                <div class="mdot mdot-r"></div>
                <div class="mdot mdot-y"></div>
                <div class="mdot mdot-g"></div>
              </div>
            </div>
            <div class="mock-body">
              <div class="mock-msg">
                <div class="sender user">You</div>
                <p>
                  How many open reqs do we have in Engineering and what's our avg time-to-hire this
                  quarter?
                </p>
              </div>
              <div class="mock-msg bot">
                <div class="sender">Provento Bot</div>
                <p>
                  Engineering has <strong>12 open requisitions</strong> — 7 senior, 3 mid, 2 junior.
                  Avg time-to-hire this quarter is <strong>34 days</strong>, down from 41 last
                  quarter. Top open role by time:
                  <strong style="color: var(--gold)">Staff ML Engineer</strong> at 62 days.
                </p>
              </div>
            </div>
            <div class="mock-footer">
              <input class="mock-input" type="text" placeholder="Ask about any system..." />
              <button class="mock-send">↑</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <div class="mq">
      <div class="mq-inner">
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Slack Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">MS Teams Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">WhatsApp Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">ERP</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">CRM</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">HRMS / ADP</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Google Drive</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">AI Signals</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">No-Code Setup</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Enterprise SSO</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Role-Based Access</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Custom APIs</span>
        </div>
        <!-- duplicate for seamless loop -->
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Slack Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">MS Teams Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">WhatsApp Integration</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">ERP</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">CRM</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">HRMS / ADP</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Google Drive</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">AI Signals</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">No-Code Setup</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Enterprise SSO</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Role-Based Access</span>
        </div>
        <div class="mq-item">
          <div class="mq-dot"></div>
          <span class="mq-txt">Custom APIs</span>
        </div>
      </div>
    </div>

    <!-- ═══ PROBLEM ═══ -->
    <section class="problem-sec" id="problem">
      <div class="wrap">
        <div class="eyebrow">The Problem</div>
        <h2 class="sec-title">
          $588 Billion Lost Every Year<br />to App-Switching in the US Alone
        </h2>
        <p class="sec-sub">
          87 million knowledge workers spend up to 2 hours a day hunting for information across
          disconnected tools. That's not a productivity issue — it's a structural problem with how
          enterprise software is built.
        </p>
        <div class="problem-hero-stat">
          <div class="pstat">
            <span class="pstat-n">87M</span>
            <div class="pstat-l">Knowledge workers<br />affected in the US</div>
          </div>
          <div class="pstat">
            <span class="pstat-n gold">$588B</span>
            <div class="pstat-l">Estimated annual<br />productivity loss</div>
          </div>
          <div class="pstat">
            <span class="pstat-n">9%</span>
            <div class="pstat-l">Of the entire workday<br />lost to app-switching</div>
          </div>
          <div class="pstat">
            <span class="pstat-n gold">$8K</span>
            <div class="pstat-l">Lost per knowledge<br />worker per year</div>
          </div>
        </div>
        <div class="drivers-grid">
          <div class="driver-card">
            <div class="driver-icon">⚙️</div>
            <h4>Fragmented Systems</h4>
            <p>
              Employees juggle 10+ enterprise apps — ERP, CRM, HRMS, ticketing — with no unified
              entry point.
            </p>
            <span class="cost">SMB: ~$5K/employee/yr</span>
          </div>
          <div class="driver-card">
            <div class="driver-icon">📂</div>
            <h4>Artifacts Everywhere</h4>
            <p>
              SOPs, policies, guidelines and reports scattered across local drives, shared disks,
              and cloud — impossible to search.
            </p>
            <span class="cost">MSME: ~$7.8K/employee/yr</span>
          </div>
          <div class="driver-card">
            <div class="driver-icon">🔄</div>
            <h4>Constant Context Switching</h4>
            <p>
              Workers lose an average of 60+ minutes per day switching between apps and waiting for
              colleagues to find answers.
            </p>
            <span class="cost">Enterprise: ~$11K/employee/yr</span>
          </div>
          <div class="driver-card">
            <div class="driver-icon">🚦</div>
            <h4>No Single Pane of Glass</h4>
            <p>
              All enterprise systems work in silos. CXOs have no unified view of org health —
              decisions are made on stale, incomplete data.
            </p>
            <span class="cost">CXOs: blind spots across functions</span>
          </div>
        </div>
        <div class="problem-insight">
          <div class="pi-dot"></div>
          <p class="pi-txt">
            Enterprise teams already live in <span>Slack, Teams & WhatsApp</span> — why not bring
            the enterprise there?
          </p>
        </div>
      </div>
    </section>

    <!-- ═══ SOLUTION ═══ -->
    <section class="solution-sec" id="solution">
      <div class="wrap">
        <div class="sol-grid">
          <div>
            <div class="eyebrow">Our Solution</div>
            <h2 class="sec-title">One AI. Every System.<br />Your Channel.</h2>
            <p style="color: var(--muted); font-size: 1rem; line-height: 1.75; margin-bottom: 2rem">
              Provento.ai sits as an intelligent layer between your people and your enterprise
              systems. Employees ask questions or trigger actions in plain English — inside the chat
              tool they already use — and get instant, accurate answers.
            </p>
            <div class="signals-points">
              <div class="sp-item">
                <div class="sp-icon sp-t">💬</div>
                <div>
                  <h5>Works in your existing channels</h5>
                  <p>
                    Install in Slack, MS Teams or WhatsApp in under 30 minutes. Zero code. No new
                    app for employees to learn.
                  </p>
                </div>
              </div>
              <div class="sp-item">
                <div class="sp-icon sp-g">🔗</div>
                <div>
                  <h5>Connects to your existing systems</h5>
                  <p>
                    ERP, CRM, HRMS, Google Drive, shared disks, databases and custom APIs — all
                    queryable in natural language.
                  </p>
                </div>
              </div>
              <div class="sp-item">
                <div class="sp-icon sp-b">✦</div>
                <div>
                  <h5>Doesn't replace your stack</h5>
                  <p>
                    Provento.ai is the AI layer across your existing tools. Your systems stay. Your
                    data stays. We just make it all conversational.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="sol-diagram">
              <div class="diag-label">Provento.ai Architecture</div>
              <div class="diag-row">
                <div class="dpill dp-t">Slack</div>
                <div class="dpill dp-b">MS Teams</div>
                <div class="dpill dp-g">WhatsApp</div>
              </div>
              <div
                style="text-align: center; padding: 4px 0; color: var(--muted); font-size: 0.75rem"
              >
                ↓ Natural language queries & actions ↓
              </div>
              <div class="diag-center">
                <div class="diag-ci">✦</div>
                <div class="diag-ct">
                  Provento AI Platform<small>Intent Engine · NLP · Routing · Signals</small>
                </div>
              </div>
              <div
                style="text-align: center; padding: 4px 0; color: var(--muted); font-size: 0.75rem"
              >
                ↓ Secure API connections ↓
              </div>
              <div class="diag-row">
                <div class="dpill dp-gray">ERP</div>
                <div class="dpill dp-gray">CRM</div>
              </div>
              <div class="diag-row">
                <div class="dpill dp-gray">HRMS / ADP</div>
                <div class="dpill dp-gray">Google Drive</div>
              </div>
              <div class="diag-row">
                <div class="dpill dp-gray">Shared Disk</div>
                <div class="dpill dp-gray">Custom APIs</div>
              </div>
              <div class="diag-divider"></div>
              <!-- <div class="diag-row">
                <div class="dpill dp-gold">AI Signals → CXOs</div>
                <div class="dpill dp-gold">Dept Heads</div>
              </div> -->
              <div class="tagline-box">
                <strong>Others help you chat. We help you execute.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HOW IT WORKS ═══ -->
    <section class="how-sec" id="how">
      <div class="wrap">
        <div class="eyebrow">How It Works</div>
        <h2 class="sec-title">Live in 30 Minutes.<br />5 Steps to Full Deployment.</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num">1</div>
            <h4>Connect</h4>
            <p>
              Install the Provento bot in Slack, Teams or WhatsApp. No code. Set up your org,
              departments and users self-service.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num">2</div>
            <h4>Integrate</h4>
            <p>
              Connect Google Drive, shared disks, CRM, ERP, HRMS and internal systems via pre-built
              connectors or REST APIs.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num">3</div>
            <h4>Converse</h4>
            <p>
              Employees ask questions or trigger workflows in plain English, directly in their daily
              chat. No training needed.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num">4</div>
            <h4>Execute</h4>
            <p>
              Provento AI handles requests, routes to the right system, and completes tasks
              instantly with source citations.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num">5</div>
            <h4>Signal</h4>
            <span class="step-new">NEW</span>
            <p>
              AI Signals are automatically pushed to CXOs and department heads — proactive
              intelligence about your org, not just reactive answers.
            </p>
          </div>
        </div>
        <div class="how-footer">
          <div class="how-foot-card">
            <div class="hfc-icon">⚡</div>
            <div class="hfc-txt">
              Employees get answers in seconds <small>Without leaving their chat app</small>
            </div>
          </div>
          <div class="how-foot-card">
            <div class="hfc-icon">📡</div>
            <div class="hfc-txt">
              CXOs get signals pushed to them <small>Org-wide intelligence, not just search</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ AI SIGNALS ═══ -->
    <section class="signals-sec" id="signals">
      <div class="wrap">
        <div class="signals-grid">
          <div class="signals-intro">
            <div class="eyebrow">AI Signals</div>
            <h2 class="sec-title">Your AI That Doesn't Wait<br />to Be Asked</h2>
            <p style="color: var(--muted); font-size: 1rem; line-height: 1.75; margin-bottom: 2rem">
              Most AI tools are reactive — they answer when asked. Provento.ai is proactive. It
              monitors your systems 24/7 and pushes critical signals to the right executive at the
              right time, automatically.
            </p>
            <div class="signals-points">
              <div class="sp-item">
                <div class="sp-icon sp-t">👁️</div>
                <div>
                  <h5>Always-on monitoring</h5>
                  <p>
                    Provento watches your connected systems continuously and surfaces patterns
                    humans would miss.
                  </p>
                </div>
              </div>
              <div class="sp-item">
                <div class="sp-icon sp-g">🎯</div>
                <div>
                  <h5>Role-targeted delivery</h5>
                  <p>
                    The right signal goes to the right person — CHRO gets HR signals, CFO gets
                    finance signals, CPO gets product signals.
                  </p>
                </div>
              </div>
              <div class="sp-item">
                <div class="sp-icon sp-b">⚡</div>
                <div>
                  <h5>No dashboard needed</h5>
                  <p>
                    Signals arrive in WhatsApp, Slack or Teams. Executives act on intelligence
                    without opening a single tool.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="signals-mockups">
            <!-- Signal 1: WhatsApp → CHRO -->
            <div class="sig-card">
              <div class="sig-card-top">
                <div class="sig-channel">
                  <span class="sig-ch-pill sig-wa">WhatsApp</span>
                </div>
                <span class="sig-recipient">→ CHRO</span>
              </div>
              <div class="sig-card-body">
                <div class="sig-bot-name">Provento Bot · Now</div>
                <p class="sig-msg">
                  Dear CHRO, <strong>employee John Doe</strong> has not availed PTO in
                  <span class="alert">6 months</span>. This may indicate potential
                  <span class="alert">burnout risk</span>. Would you like to flag this for a
                  wellness check-in?
                </p>
                <div class="sig-action">
                  <button class="sig-act-btn">Schedule Check-in</button>
                  <button class="sig-act-btn">View Full Report</button>
                </div>
              </div>
            </div>

            <!-- Signal 2: Teams → CEO -->
            <div class="sig-card">
              <div class="sig-card-top">
                <div class="sig-channel">
                  <span class="sig-ch-pill sig-teams">MS Teams</span>
                </div>
                <span class="sig-recipient">→ CEO</span>
              </div>
              <div class="sig-card-body">
                <div class="sig-bot-name">Provento Bot · Now</div>
                <p class="sig-msg">
                  Dear CEO, CRM usage has <span class="alert">dropped by 20%</span> from Slack this
                  week. Your Sales team may not be updating <strong>CRM</strong> regularly. This
                  could affect pipeline accuracy for Q3 forecasting.
                </p>
                <div class="sig-action">
                  <button class="sig-act-btn">View CRM Usage</button>
                  <button class="sig-act-btn">Notify Sales Lead</button>
                </div>
              </div>
            </div>

            <!-- Signal 3: Slack → CPO -->
            <div class="sig-card">
              <div class="sig-card-top">
                <div class="sig-channel">
                  <span class="sig-ch-pill sig-slack">Slack</span>
                </div>
                <span class="sig-recipient">→ CPO</span>
              </div>
              <div class="sig-card-body">
                <div class="sig-bot-name">Provento Bot · 10:23 AM</div>
                <p class="sig-msg">
                  Dear CPO, the following licenses are up for renewal in
                  <span class="highlight">60 days</span>:<br />• <strong>ERP</strong> &nbsp;•
                  <strong>CRM</strong> &nbsp;• <strong>Stripe</strong><br />Take action now to avoid
                  service interruptions and lapses.
                </p>
                <div class="sig-action">
                  <button class="sig-act-btn">Review Renewals</button>
                  <button class="sig-act-btn">Set Reminders</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ COMPETITION ═══ -->
    <section class="comp-sec" id="compare">
      <div class="wrap">
        <div class="eyebrow">Why Provento</div>
        <h2 class="sec-title">Others Help You Chat.<br />We Help You Execute.</h2>
        <p class="sec-sub">
          Provento.ai is the only platform that combines multi-channel delivery, live enterprise
          system integration, AI Signals, and flexible pricing — all without writing a single line
          of code.
        </p>
        <table class="comp-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th class="us">Provento.ai</th>
              <th>Traditional Automation</th>
              <th>X Pilot</th>
              <th>AI Assistants</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Multi-channel (Slack + Teams + WhatsApp)</td>
              <td class="us comp-yes">✓ All three</td>
              <td class="comp-no">✗</td>
              <td class="comp-partial">Teams only</td>
              <td class="comp-partial">Varies</td>
            </tr>
            <tr>
              <td>Pre-built enterprise integrations</td>
              <td class="us comp-yes">✓ Ready now</td>
              <td class="comp-partial">Complex setup</td>
              <td class="comp-partial">MS stack only</td>
              <td class="comp-no">Minimal</td>
            </tr>
            <tr>
              <td>No-code setup for IT teams</td>
              <td class="us comp-yes">✓ 30 mins</td>
              <td class="comp-no">✗</td>
              <td class="comp-partial">Partial</td>
              <td class="comp-no">✗</td>
            </tr>
            <tr>
              <td>AI-native natural language</td>
              <td class="us comp-yes">✓</td>
              <td class="comp-no">✗</td>
              <td class="comp-partial">Limited</td>
              <td class="comp-partial">Chat only</td>
            </tr>
            <tr>
              <td>Proactive AI Signals to executives</td>
              <td class="us comp-yes">✓ Unique</td>
              <td class="comp-no">✗</td>
              <td class="comp-no">✗</td>
              <td class="comp-no">✗</td>
            </tr>
            <tr>
              <td>Role-based access control</td>
              <td class="us comp-yes">✓ Enterprise-ready</td>
              <td class="comp-partial">Partial</td>
              <td class="comp-yes">✓</td>
              <td class="comp-no">✗</td>
            </tr>
            <tr>
              <td>SMB to Enterprise pricing</td>
              <td class="us comp-yes">✓ From $29/mo</td>
              <td class="comp-partial">Enterprise only</td>
              <td class="comp-partial">Enterprise only</td>
              <td class="comp-partial">Varies</td>
            </tr>
          </tbody>
        </table>
        <p class="comp-tagline">Others help you <em>chat.</em> We help you <span>execute.</span></p>
      </div>
    </section>

    <!-- ═══ TRACTION ═══ -->
    <section class="traction-sec" id="traction">
      <div class="wrap">
        <div class="eyebrow">Early Traction</div>
        <h2 class="sec-title">Built. Proven. Ready to Scale.</h2>
        <p class="sec-sub">
          MVP++ complete with enterprise pilots signed and real signal from the market.
        </p>
        <div class="traction-bar">
          <div class="tr-item">
            <span class="tr-n">MVP++</span>
            <div class="tr-l">Product complete &amp; live</div>
          </div>
          <div class="tr-item">
            <span class="tr-n">3 LOIs</span>
            <div class="tr-l">Enterprise pilots signed</div>
          </div>
          <div class="tr-item">
            <span class="tr-n">50+</span>
            <div class="tr-l">Waitlist sign-ups</div>
          </div>
        </div>
        <div class="traction-grid">
          <div class="built-list">
            <h4>What We've Built</h4>
            <div class="built-item">AI engine with intent recognition and multi-system routing</div>
            <div class="built-item">
              Integrations for HRMS, Finance, ERP tools and custom REST APIs
            </div>
            <div class="built-item">Slack &amp; MS Teams bots with enterprise SSO (OAuth/SAML)</div>
            <div class="built-item">WhatsApp Business API integration (Meta approved)</div>
            <div class="built-item">Department structure and role-based access control</div>
            <div class="built-item">Built-in security and privacy for customer data</div>
            <div class="built-item">Proactive AI Signals engine for CXO-level insights</div>
          </div>
          <div class="quote-card">
            <div class="quote-mark">"</div>
            <p class="quote-text">
              The ability to query our HRMS directly from Slack has saved our HR team hours every
              day. This is the AI integration we've been waiting for.
            </p>
            <span class="quote-attr">— Head of Operations, Enterprise Pilot Partner</span>
          </div>
        </div>
        <div class="integrations-strip">
          <span class="int-label">Live integrations</span>
          <div class="int-pills">
            <span class="int-pill">Google Drive</span>
            <span class="int-pill">ADP</span>
            <span class="int-pill">Keka</span>
            <span class="int-pill">Gusto</span>
            <span class="int-pill">Razorpay</span>
            <span class="int-pill">Slack</span>
            <span class="int-pill">MS Teams</span>
            <span class="int-pill">WhatsApp Business</span>
            <span class="int-pill">Custom REST APIs</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ PRICING ═══ -->
    <section class="pricing-sec" id="pricing">
      <div class="wrap">
        <div class="eyebrow">Pricing</div>
        <h2 class="sec-title">Simple, Transparent Pricing</h2>
        <p class="sec-sub">
          Start free. Scale as you grow. No long-term commitments. 20% discount on annual billing.
        </p>
        <div class="pricing-grid">
          <div class="price-card">
            <div class="price-name">Starter</div>
            <div class="price-amt">$29</div>
            <div class="price-per">per month · up to 50 users</div>
            <ul class="price-features">
              <li>1,000 AI queries per month</li>
              <li>5 GB storage</li>
              <li>Up to 100 artifacts</li>
              <li>Slack or Teams integration</li>
              <li>Basic support</li>
            </ul>
            <NuxtLink to="/book-meeting" class="price-cta price-cta-outline"
              >Get Started Free</NuxtLink
            >
          </div>
          <div class="price-card featured">
            <div class="price-popular">Most Popular</div>
            <div class="price-name" style="margin-top: 14px">Professional</div>
            <div class="price-amt">$99</div>
            <div class="price-per">per month · up to 500 users</div>
            <ul class="price-features">
              <li>10,000 AI queries per month</li>
              <li>50 GB storage</li>
              <li>Up to 1,000 artifacts</li>
              <li>Slack, Teams + WhatsApp</li>
              <li>AI Signals for managers</li>
              <li>Priority support + SLA</li>
            </ul>
            <NuxtLink to="/book-meeting" class="price-cta price-cta-filled"
              >Start Free Trial</NuxtLink
            >
          </div>
          <div class="price-card">
            <div class="price-name">Enterprise</div>
            <div class="price-amt" style="font-size: 2rem">Custom</div>
            <div class="price-per">unlimited users · dedicated instance</div>
            <ul class="price-features">
              <li>Unlimited AI queries</li>
              <li>Unlimited storage</li>
              <li>All integrations + custom APIs</li>
              <li>AI Signals for full CXO suite</li>
              <li>Custom deployment &amp; SLA</li>
              <li>Dedicated onboarding support</li>
            </ul>
            <NuxtLink to="/book-meeting" class="price-cta price-cta-outline"
              >Talk to Sales</NuxtLink
            >
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ TEAM ═══ -->
    <section class="team-sec" id="team">
      <div class="wrap">
        <div class="eyebrow">The Team</div>
        <h2 class="sec-title">Built by People Who've Lived<br />the Enterprise Pain Firsthand</h2>
        <p class="sec-sub">
          25+ years of combined enterprise technology experience — building products used by Fortune
          100 companies.
        </p>
        <div class="team-grid">
          <div class="team-card">
            <div class="team-av">SY</div>
            <h4>Sai Yendluri</h4>
            <div class="role">Founder &amp; CEO</div>
            <div class="exp">
              25 years of technology &amp; enterprise leadership. Led products used by Fortune 100
              companies.
            </div>
          </div>
          <div class="team-card">
            <div class="team-av">SS</div>
            <h4>Sudhakar Shenoy</h4>
            <div class="role">Head of Engineering</div>
            <div class="exp">
              25 years building enterprise products, AI models and optimisations at scale.
            </div>
          </div>
          <div class="team-card">
            <div class="team-av">SK</div>
            <h4>Srikar Kudumula</h4>
            <div class="role">Enabler</div>
            <div class="exp">
              Expert in Data Science, AI Product Management and Business Development.
            </div>
          </div>
          <div class="team-card">
            <div class="team-av">RB</div>
            <h4>Rajashree Batwar</h4>
            <div class="role">Builder</div>
            <div class="exp">
              10+ years building complex enterprise products from concept to production.
            </div>
          </div>
        </div>
        <div class="advisors-strip">
          <span class="adv-label">Advised by</span>
          <div class="adv-items">
            <span class="adv-pill"><span>Murthy Jayanthi</span> · Ex-Amazon, Ex-Ebay</span>
            <span class="adv-pill"
              ><span>Bharadwaj Pudipeddi</span> · Ex-Google Brain, 3 AI patents</span
            >
            <span class="adv-pill"><span>Former CIOs</span> · Global enterprises</span>
            <span class="adv-pill"><span>VCs</span> · Enterprise SaaS exits · SF Bay Area</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ CTA ═══ -->
    <section class="cta-sec">
      <div class="wrap">
        <div class="cta-box">
          <h2>Provento.ai doesn't replace<br />your <em>tools.</em></h2>
          <p class="sub">It's the AI layer across your existing stack.</p>
          <p>
            Join the enterprises already building with Provento.ai.<br />Get up and running in 30
            minutes — no code required.
          </p>
          <div class="btn-row" style="justify-content: center">
            <NuxtLink to="/book-meeting" class="btn-primary">Book a Demo</NuxtLink>
            <NuxtLink to="/book-meeting" class="btn-ghost">Start Free Trial</NuxtLink>
          </div>
          <div class="cta-contact">
            <a href="mailto:contact@provento.ai">✉ contact@provento.ai</a>
            <span>🌐 app.provento.ai</span>
            <a
              href="https://www.linkedin.com/company/provento-ai/"
              target="_blank"
              rel="noopener noreferrer"
              >in LinkedIn</a
            >
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'provento.ai - One AI Layer. Every System. Your Channel.',
  meta: [
    {
      name: 'description',
      content:
        'Provento.ai connects ERP, HRMS, CRM and artifacts to Slack, Teams and WhatsApp through one conversational AI layer.',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700&display=swap',
    },
  ],
})

const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  const target = sessionStorage.getItem('landing-section')
  if (!target) return

  sessionStorage.removeItem('landing-section')
  await nextTick()
  scrollToSection(target)
})
</script>
