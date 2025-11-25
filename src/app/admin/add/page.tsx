import { AddProductForm } from './AddProductForm';

export default async function AddProductPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="mt-2 text-muted-foreground">Create a new product with variants and assets</p>
        </div>
        <AddProductForm />
      </div>
    </div>
  );
}

