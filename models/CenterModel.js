import { Schema, model } from "mongoose";

const centerSchema = new Schema({
  center: { type: String, required: true },
});

const Center = model("centers", centerSchema);

export default Center;
