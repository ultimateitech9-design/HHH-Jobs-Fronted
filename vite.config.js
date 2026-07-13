import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import { gzipSync } from 'node:zlib'

const publicRouteChunkGroups = [
  { pattern: '^/jobs/cities/?$', chunks: ['LocationDirectoryPage'] },
  { pattern: '^/jobs/(?:sectors|categories)/?$', chunks: ['FacetDirectoryPage'] },
  { pattern: '^/jobs/(?!(?:cities|sectors|categories)(?:/|$))[^/]+/?$', chunks: ['StudentJobDetailsPage'] },
  { pattern: '^/jobs/?$', chunks: ['PublicJobsLandingPage'] },
  { pattern: '^/govt-jobs/[^/]+/?$', chunks: ['StudentGovtJobDetailsPage'] },
  { pattern: '^/govt-jobs/?$', chunks: ['StudentGovtJobsPage'] },
  { pattern: '^/companies/[^/]+/?$', chunks: ['CompanyJobsPage'] },
  { pattern: '^/companies/?$', chunks: ['CompaniesPage'] },
  { pattern: '^/ats/?$', chunks: ['PublicAtsPage'] },
  { pattern: '^/services/?$', chunks: ['ServicesPage'] },
  { pattern: '^/emp-verify/?$', chunks: ['EmpVerifyPage'] },
  { pattern: '^/job-seekers/?$', chunks: ['JobSeekersPage'] },
  { pattern: '^/recruiters/?$', chunks: ['RecruitersPage'] },
  { pattern: '^/freshers/?$', chunks: ['FreshersPage'] },
  { pattern: '^/veterans/?$', chunks: ['VeteransPage'] },
  { pattern: '^/campus-connect/?$', chunks: ['CampusConnectPage'] },
  { pattern: '^/retired-employee/?$', chunks: ['RetiredEmployeePage'] },
  { pattern: '^/login(?:/[^/]+)?/?$', chunks: ['LoginPage'] },
  { pattern: '^/sign-up/?$', chunks: ['SignupPage'] },
  { pattern: '^/campus-connect/register/?$', chunks: ['CampusConnectRegisterPage'] },
  { pattern: '^/verify-otp/?$', chunks: ['OtpVerificationPage'] },
  { pattern: '^/forgot-password/?$', chunks: ['ForgotPasswordPage'] },
  { pattern: '^/oauth/callback/?$', chunks: ['OAuthCallbackPage'] },
  { pattern: '^/blog/[^/]+/?$', chunks: ['BlogArticlePage'] },
  { pattern: '^/blog/?$', chunks: ['BlogPage'] },
  { pattern: '^/about-us/?$', chunks: ['AboutUsPage'] },
  { pattern: '^/careers/?$', chunks: ['CareersPage'] },
  { pattern: '^/contact-us/?$', chunks: ['ContactUsPage'] },
  { pattern: '^/help-center/?$', chunks: ['HelpCenterPage'] },
  { pattern: '^/privacy-policy/?$', chunks: ['PrivacyPolicyPage'] },
  { pattern: '^/terms-and-conditions/?$', chunks: ['TermsAndConditionsPage'] },
  { pattern: '^/grievances/?$', chunks: ['GrievancesPage'] },
  { pattern: '^/report-issue/?$', chunks: ['ReportIssuePage'] },
  { pattern: '^/fraud-alert/?$', chunks: ['FraudAlertPage'] },
  { pattern: '^/trust-and-safety/?$', chunks: ['TrustAndSafetyPage'] },
  { pattern: '^/summons-notices/?$', chunks: ['SummonsNoticesPage'] }
]

const manualChunks = (id) => {
  const normalizedId = id.replace(/\\/g, '/')
  if (!normalizedId.includes('/node_modules/')) return undefined

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/react-router-dom/') ||
    normalizedId.includes('/@remix-run/router/') ||
    normalizedId.includes('/react-helmet-async/')
  ) {
    return 'vendor-react'
  }

  if (normalizedId.includes('/lucide-react/')) return 'vendor-lucide'
  if (normalizedId.includes('/react-hot-toast/')) return 'vendor-toast'
  if (normalizedId.includes('/zustand/')) return 'vendor-state'
  if (normalizedId.includes('/react-hook-form/') || normalizedId.includes('/react-select/')) return 'vendor-forms'
  if (normalizedId.includes('/sweetalert2/')) return 'vendor-dialogs'

  return undefined
}

const deferEntryStylesheet = () => ({
  name: 'defer-entry-stylesheet',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html) {
    return html.replace(
      /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
      `<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`
    )
  }
})

const routeAwareModulePreloads = () => ({
  name: 'route-aware-module-preloads',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html, context) {
    if (!context.bundle) return html

    const chunks = Object.values(context.bundle).filter((entry) => entry.type === 'chunk')
    const preloadGroups = publicRouteChunkGroups
      .map((group) => {
        const files = group.chunks
          .map((chunkName) => chunks.find((entry) => entry.name === chunkName)?.fileName)
          .filter(Boolean)
          .map((fileName) => `/${fileName}`)
        return { pattern: group.pattern, files }
      })
      .filter((group) => group.files.length > 0)

    if (preloadGroups.length === 0) return html

    const preloadScript = `(function(){var p=location.pathname;var g=${JSON.stringify(preloadGroups)};for(var i=0;i<g.length;i++){if(!(new RegExp(g[i].pattern)).test(p))continue;for(var j=0;j<g[i].files.length;j++){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=g[i].files[j];document.head.appendChild(l)}break}})();`

    return {
      html,
      tags: [{ tag: 'script', children: preloadScript, injectTo: 'head' }]
    }
  }
})

const precompressBuildAssets = () => ({
  name: 'precompress-build-assets',
  apply: 'build',
  generateBundle(_options, bundle) {
    Object.values(bundle).forEach((entry) => {
      if (!/\.(?:css|html|js|json|svg|txt|xml)$/.test(entry.fileName)) return

      const rawSource = entry.type === 'chunk' ? entry.code : entry.source
      const source = Buffer.isBuffer(rawSource) ? rawSource : Buffer.from(String(rawSource))
      if (source.length < 1024) return

      const compressed = gzipSync(source, { level: 9 })
      if (compressed.length >= source.length) return

      this.emitFile({
        type: 'asset',
        fileName: `${entry.fileName}.gz`,
        source: compressed
      })
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), deferEntryStylesheet(), routeAwareModulePreloads(), precompressBuildAssets()],
  build: {
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
})
