import mongoose, { Schema } from "mongoose";

import type { CloudinaryResourceType } from "@/core/lib/types";

export interface PostDocument extends mongoose.Document<mongoose.Types.ObjectId> {
  title: string;
  slug: string;
  excerpt?: string;
  documentJson: string;
  documentHtml: string;
  published: boolean;
  publishedAt: Date | null;
  author: mongoose.Types.ObjectId;
  coverImage: CloudinaryResourceType;
  categories: mongoose.Types.ObjectId[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    documentJson: { type: String },
    documentHtml: { type: String },
    excerpt: { type: String },
    published: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date },
    author: { ref: "User", type: mongoose.Schema.Types.ObjectId },
    coverImage: { type: Schema.Types.Mixed },
    categories: {
      ref: "Category",
      type: [mongoose.Schema.Types.ObjectId],
      index: true,
    },
    commentCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // https://mongoosejs.com/docs/guide.html#minimize
    // Mongoose will, by default, "minimize" schemas by removing empty objects.
    // This behavior can be overridden by setting minimize option to false. It will then store empty objects.
    // minimizing schema might break the document structure of BlockNote PartialBlock (editorContent).
    minimize: false,
  },
);

const PostModel = mongoose.model<PostDocument>("Post", postSchema);

export default PostModel;
