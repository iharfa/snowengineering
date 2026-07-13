import { saveProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Product } from "@/lib/types";

// Shared server-rendered form for /admin/products/new and /admin/products/[code]
export function ProductForm({
  product,
  error,
}: {
  product?: Product;
  error?: string;
}) {
  const editing = Boolean(product);
  const specsText = product?.specifications
    .map((s) => `${s.label}: ${s.value}`)
    .join("\n");

  return (
    <form action={saveProductAction} className="space-y-4">
      <input type="hidden" name="mode" value={editing ? "update" : "create"} />
      {error && (
        <p className="text-sm" style={{ color: "#ba1a1a" }}>
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Item code (unique, e.g. SP-XYZ-013)</Label>
          {editing ? (
            <>
              <Input value={product!.erpnextItemCode} disabled />
              <input
                type="hidden"
                name="item_code"
                value={product!.erpnextItemCode}
              />
            </>
          ) : (
            <Input name="item_code" required placeholder="SP-XYZ-013" />
          )}
        </div>
        <div>
          <Label>Name</Label>
          <Input name="name" required defaultValue={product?.name} />
        </div>
        <div>
          <Label>Category</Label>
          <Input
            name="category"
            required
            defaultValue={product?.category}
            placeholder="Spare Parts"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            <option value="VRFs" />
            <option value="Small Water Plants" />
            <option value="Spare Parts" />
            <option value="Controllers" />
          </datalist>
        </div>
        <div>
          <Label>URL slug (blank = from name)</Label>
          <Input name="slug" defaultValue={product?.slug} />
        </div>
        <div>
          <Label>Price (MVR)</Label>
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product?.price}
          />
        </div>
        <div>
          <Label>GST rate %</Label>
          <Input
            name="gst_rate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            defaultValue={product?.gstRate ?? 8}
          />
        </div>
        <div>
          <Label>Stock status</Label>
          <Select name="stock_status" defaultValue={product?.stockStatus ?? "On Request"}>
            <option value="In Stock">In Stock</option>
            <option value="Made to Order">Made to Order</option>
            <option value="On Request">On Request</option>
          </Select>
        </div>
        <div>
          <Label>Image (path under /products/ or https URL)</Label>
          <Input
            name="image"
            defaultValue={product?.image}
            placeholder="/products/placeholder.svg"
          />
        </div>
      </div>
      <div>
        <Label>Short description (shop card)</Label>
        <Input name="short_description" defaultValue={product?.shortDescription} />
      </div>
      <div>
        <Label>Long description (product page)</Label>
        <Textarea name="long_description" defaultValue={product?.longDescription} />
      </div>
      <div>
        <Label>Specifications — one per line, format “Label: value”</Label>
        <Textarea
          name="specifications"
          defaultValue={specsText}
          placeholder={"Capacity: 8–16 HP\nRefrigerant: R410A"}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input
          type="checkbox"
          name="is_price_hidden"
          value="true"
          defaultChecked={product?.isPriceHidden ?? true}
        />
        Hide price on the shop (visitors click “reveal” — tracked for demand
        analytics)
      </label>
      <div className="flex gap-3">
        <Button type="submit">{editing ? "Save changes" : "Create product"}</Button>
      </div>
    </form>
  );
}
