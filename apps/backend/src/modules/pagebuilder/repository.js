import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/page-builder.json');

function defaultLayout() {
  return {
    header: {
      blocks: [
        {
          id: 'global-header-section',
          type: 'section',
          props: { backgroundColor: 'var(--color-secondary)', color: 'var(--text-color)', padding: '16px 20px', margin: '0' }
        },
        {
          id: 'global-logo',
          type: 'logo',
          props: { text: 'LMS Platform', href: '/', color: 'var(--text-color)', fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0' }
        },
        {
          id: 'global-nav',
          type: 'nav',
          props: { items: 'Home:/,Courses:/courses,Community:/community,Dashboard:/dashboard', color: 'var(--text-color)', gap: '14px' }
        }
      ]
    },
    footer: {
      blocks: [
        {
          id: 'global-footer-section',
          type: 'section',
          props: { backgroundColor: 'var(--background-color)', color: 'var(--text-color)', padding: '22px 20px', margin: '24px 0 0 0' }
        },
        {
          id: 'global-footer-text',
          type: 'text',
          props: { text: '© LMS Platform. All rights reserved.', color: 'var(--text-color)' }
        },
        {
          id: 'global-footer-link',
          type: 'link',
          props: { text: 'Privacy Policy', href: '/site/privacy', color: 'var(--color-accent)', margin: '10px 0 0 0' }
        }
      ]
    },
    updatedAt: new Date().toISOString()
  };
}

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ pages: [], layout: defaultLayout() }, null, 2));
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  if (!parsed.layout) {
    parsed.layout = defaultLayout();
    fs.writeFileSync(DATA_PATH, JSON.stringify(parsed, null, 2));
  }
}

function readData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export const pageBuilderRepository = {
  listPages() {
    return readData().pages;
  },
  getPageById(id) {
    return readData().pages.find((p) => p.id === id && !p.deletedAt) || null;
  },
  getPageBySlug(slug) {
    return readData().pages.find((p) => p.slug === slug && !p.deletedAt) || null;
  },
  savePage(page) {
    const data = readData();
    const idx = data.pages.findIndex((p) => p.id === page.id);
    if (idx >= 0) data.pages[idx] = page;
    else data.pages.push(page);
    writeData(data);
    return page;
  },
  getGlobalLayout() {
    return readData().layout || defaultLayout();
  },
  saveGlobalLayout(layout) {
    const data = readData();
    data.layout = layout;
    writeData(data);
    return layout;
  }
};
