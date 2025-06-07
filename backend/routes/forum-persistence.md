# Forum Persistence Example for EquiHealth Backend (Prisma Version, TypeScript)

This guide shows how to persist posts and comments for the Community Forum using **Prisma** and your database (PostgreSQL, MySQL, etc.) in a TypeScript Express backend.

---

## 1. Update Your Prisma Schema

Add the following models to your `prisma/schema.prisma` file:

```prisma
model Post {
  id        String    @id @default(cuid())
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  content   String
  imageUrl  String?
  comments  Comment[]
  createdAt DateTime  @default(now())
}

model Comment {
  id        String    @id @default(cuid())
  post      Post      @relation(fields: [postId], references: [id])
  postId    String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  content   String
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  parentId  String?
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime  @default(now())
}
```

---

## 2. Run Migration

```bash
npx prisma migrate dev --name add_forum_models
```

---

## 3. Backend Route Example Using Prisma Client (TypeScript)

Create a new file, e.g., `EquiHealth/backend/routes/forum.ts`:

```ts
import express, { Request, Response } from 'express';
import { PrismaClient, Post, Comment, User } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all posts with comments and nested replies
router.get('/forum', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        comments: {
          where: { parentId: null },
          include: {
            author: true,
            replies: {
              include: {
                author: true,
                replies: { // Nested replies (2 levels deep)
                  include: { author: true }
                }
              }
            }
          }
        }
      }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Add a new post
router.post('/forum', async (req: Request, res: Response) => {
  const { authorId, content, imageUrl } = req.body;
  if (!authorId || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    const post = await prisma.post.create({
      data: {
        authorId,
        content,
        imageUrl: imageUrl || null,
      },
      include: { author: true, comments: true }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add a comment or reply
router.post('/forum/:postId/comment', async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { authorId, content, parentCommentId } = req.body;
  if (!authorId || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentId: parentCommentId || null,
      },
      include: { author: true, replies: true }
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
```

---

## 4. Integration

- Place this code in a new file, e.g., `EquiHealth/backend/routes/forum.ts`.
- Add `app.use(require('./routes/forum').default)` in your main backend file (e.g., `server.ts` or `app.ts`).
- Make sure your frontend uses the correct user IDs for `authorId` when creating posts/comments.
- All forum data will now be persisted in your database via Prisma.

---

**You can find this guide in:**  
`EquiHealth/backend/routes/forum-persistence.md` 