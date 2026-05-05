import bcrypt from 'bcryptjs';
import postgres from 'postgres';

export async function seed(databaseUrl?: string): Promise<void> {
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const existing = await sql<{ count: string }[]>`SELECT COUNT(*)::text AS count FROM users`;
    if (Number(existing[0].count) > 0) {
      console.log('[seed] users already present, skipping');
      return;
    }

    const instructorHash = await bcrypt.hash('instructor123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    const [instructor] = await sql<{ id: string }[]>`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('instructor@lms.local', ${instructorHash}, 'Ada Lovelace', 'instructor')
      RETURNING id;
    `;

    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('student@lms.local', ${studentHash}, 'Grace Hopper', 'student');
    `;

    const [course] = await sql<{ id: string }[]>`
      INSERT INTO courses (title, slug, description, instructor_id, published, cover_url)
      VALUES (
        'Intro to Modern Web',
        'intro-to-modern-web',
        'A short, hands-on tour of the modern web stack: HTTP, HTML, CSS, JavaScript, and a tiny full-stack app.',
        ${instructor.id},
        true,
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=70'
      )
      RETURNING id;
    `;

    const lessonsToInsert = [
      {
        title: 'How the Web Works',
        position: 1,
        duration: 480,
        video: 'https://www.youtube.com/embed/AlkDbnbv7dk',
        content: `# How the Web Works

The web is a network of computers exchanging text. When you type a URL:

1. Your **browser** asks DNS for an IP address
2. It opens a TCP connection and speaks **HTTP**
3. The **server** returns HTML, which references CSS, JS, and images
4. The browser parses, renders, and runs scripts

> By the end of this lesson you should be able to describe a request/response cycle in one paragraph.`,
      },
      {
        title: 'HTML, CSS, and the DOM',
        position: 2,
        duration: 720,
        video: 'https://www.youtube.com/embed/UB1O30fR-EE',
        content: `# HTML, CSS, and the DOM

HTML describes structure. CSS describes presentation. The **DOM** is what the browser builds from your HTML so JavaScript can manipulate it.

\`\`\`html
<button id="hi">Say hi</button>
<script>
  document.getElementById('hi').addEventListener('click', () => alert('hi'));
</script>
\`\`\`

Practice: open DevTools and inspect this page. Find the heading element and change its text from the console.`,
      },
      {
        title: 'Building a Tiny Full-Stack App',
        position: 3,
        duration: 900,
        video: 'https://www.youtube.com/embed/Sklc_fQBmcs',
        content: `# Building a Tiny Full-Stack App

We'll wire up a frontend page to a backend route that returns JSON.

- **Frontend**: a form that POSTs to \`/api/echo\`
- **Backend**: a route handler that responds with the same payload

The point isn't the app — it's the pattern: *clients send messages, servers reply*.`,
      },
    ];

    for (const l of lessonsToInsert) {
      await sql`
        INSERT INTO lessons (course_id, title, content_md, video_url, position, duration_seconds)
        VALUES (${course.id}, ${l.title}, ${l.content}, ${l.video}, ${l.position}, ${l.duration});
      `;
    }

    console.log('[seed] inserted instructor + student + course (3 lessons)');
    console.log('[seed]   instructor: instructor@lms.local / instructor123');
    console.log('[seed]   student:    student@lms.local / student123');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed().catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  });
}
