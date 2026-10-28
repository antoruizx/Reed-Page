import mongoose from "mongoose";

// Un diseño para estampar: del catálogo de Reed, subido por un cliente o creado con IA
const designSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["catalog", "upload", "ai"], required: true },
    name: { type: String, trim: true, default: "Mi diseño" },
    tags: [String],
    url: String, // catálogo con archivo en /public (ej: /img/designs/sol.svg)
    data: { type: Buffer, select: false }, // archivo guardado en la base (subidos e IA)
    mime: String,
    width: Number,
    height: Number,
    prompt: String, // texto usado para generarlo con IA
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

designSchema.virtual("src").get(function () {
  return this.url || `/api/designs/${this._id}/image`;
});

designSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.data;
    return ret;
  },
});

export default mongoose.models.Design || mongoose.model("Design", designSchema);
