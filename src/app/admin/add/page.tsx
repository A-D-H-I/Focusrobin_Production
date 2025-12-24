import { AddProductForm } from './AddProductForm';

// Force dynamic rendering - prevents static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AddProductPage() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="mt-2 text-muted-foreground">Create a new product with variants and assets</p>
        </div>
        <AddProductForm />
      </div>
    </div>
  );
}

