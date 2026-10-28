import mongoose from "mongoose";
import crypto from "node:crypto";
import { ORDER_STATUSES } from "../config.js";

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: String,
    image: String,
    color: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // precio unitario al momento de comprar
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: Number, unique: true }, // número corto y legible: #1001, #1002...
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Clave secreta para que alguien que compró sin cuenta pueda ver su pedido
    accessKey: { type: String, default: () => crypto.randomBytes(16).toString("hex"), select: false },
    customer: {
      name: { type: String, required: [true, "Ingresá tu nombre"], trim: true },
      email: { type: String, required: [true, "Ingresá tu email"], lowercase: true, trim: true },
      phone: { type: String, required: [true, "Ingresá un teléfono"], trim: true },
    },
    shipping: {
      method: { type: String, enum: ["retiro", "envio"], required: true },
      address: String,
      city: String,
      province: String,
      zip: String,
      notes: String,
    },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, "El carrito está vacío"] },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pendiente" },
    payment: {
      preferenceId: String,
      paymentId: String,
      status: String, // approved | pending | in_process | rejected ...
      statusDetail: String,
      method: String,
      paidAt: Date,
    },
    stockApplied: { type: Boolean, default: false }, // evita descontar stock dos veces
  },
  { timestamps: true }
);

const counterSchema = new mongoose.Schema({ _id: String, seq: Number });
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

orderSchema.pre("validate", async function () {
  if (this.number) return;
  const c = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.number = 1000 + c.seq;
});

orderSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.accessKey;
    delete ret.stockApplied;
    return ret;
  },
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
