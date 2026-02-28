const { z } = require('zod');

const schema = z.object({
    frameMaterial: z.string().trim().max(100).optional(),
});

const result = schema.safeParse({ frameMaterial: "" });
console.log("Empty string:", result.success ? result.data : result.error.errors);

const result2 = schema.safeParse({ frameMaterial: undefined });
console.log("Undefined:", result2.success ? result2.data : result2.error.errors);
