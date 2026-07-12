import type { Plugin } from 'vite';

export function htmlMetaPlugin(): Plugin {
  return {
    name: 'html-meta-plugin',
    transformIndexHtml(html) {
      const env = process.env.VITE_ENV || 'dev';

      let frontendUrl = 'https://dev.landbitt.com';
      if (env === 'stage') {
        frontendUrl = 'https://stage.landbitt.com';
      } else if (env === 'prod') {
        frontendUrl = 'https://user.landbitt.com';
      }

      const ogImage = `${frontendUrl}/web-app-manifest-512x512.png`;

      // Replace meta tags with environment-specific values
      html = html.replace(
        /<meta property="og:image" content="[^"]*" \/>/g,
        `<meta property="og:image" content="${ogImage}" />`
      );

      html = html.replace(
        /<meta property="og:image:secure_url" content="[^"]*" \/>/g,
        `<meta property="og:image:secure_url" content="${ogImage}" />`
      );

      html = html.replace(
        /<meta property="og:url" content="[^"]*" \/>/g,
        `<meta property="og:url" content="${frontendUrl}" />`
      );

      html = html.replace(
        /<meta name="twitter:image" content="[^"]*" \/>/g,
        `<meta name="twitter:image" content="${ogImage}" />`
      );

      return html;
    },
  };
}
