import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'april_template',
  tagline: 'Шаблон микросервиса April — документация и контекст',
  favicon: 'img/favicon.ico',

  url: 'https://dev.example.com',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'adr',
        path: '../docs/adr',
        routeBasePath: 'adr',
        sidebarPath: './sidebarsAdr.ts',
        editUrl: undefined,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guides',
        path: '../docs/guides',
        routeBasePath: 'guides',
        sidebarPath: './sidebarsGuides.ts',
        editUrl: undefined,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'april_template',
      logo: {
        alt: 'april_template',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Документация',
        },
        {
          type: 'docSidebar',
          sidebarId: 'adrSidebar',
          docsPluginId: 'adr',
          position: 'left',
          label: 'ADR',
        },
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          docsPluginId: 'guides',
          position: 'left',
          label: 'Шаблон репо',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Документация',
          items: [
            {
              label: 'Введение',
              to: '/docs/intro',
            },
            {
              label: 'Быстрый старт',
              to: '/docs/getting-started',
            },
            {
              label: 'Форк и версии',
              to: '/guides/FORK_AND_CUSTOMIZE',
            },
            {
              label: 'Дизайн-система April',
              to: '/guides/DESIGN_SYSTEM',
            },
          ],
        },
      ],
      copyright: `april_template · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
