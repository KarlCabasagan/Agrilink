// Shared products data to avoid duplication across components
export const products = [
    {
        id: 1,
        name: "Carrot",
        price: 2.5,
        image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
        address: "Maria Cristina, Purok 9 Zone 3",
        category: "Vegetables",
        farmerName: "Juan Dela Cruz",
        description:
            "Fresh organic carrots grown locally. Rich in beta-carotene and perfect for cooking or eating raw. These carrots are hand-picked and carefully selected for quality.",
        stock: 25,
        rating: 4.5,
        reviews: [
            {
                user: "John D.",
                rating: 5,
                comment: "Very fresh and crunchy!",
                date: "2025-08-30",
            },
            {
                user: "Maria S.",
                rating: 4,
                comment: "Good quality carrots",
                date: "2025-08-28",
            },
            {
                user: "Pedro L.",
                rating: 5,
                comment: "Best carrots in the area!",
                date: "2025-08-25",
            },
        ],
    },
    {
        id: 2,
        name: "Apple",
        price: 8.0,
        image: "https://assets.clevelandclinic.org/transform/LargeFeatureImage/cd71f4bd-81d4-45d8-a450-74df78e4477a/Apples-184940975-770x533-1_jpg",
        address: "Zone 4, Barangay 5",
        category: "Fruits",
        farmerName: "Maria Santos",
        description:
            "Crisp and sweet apples perfect for snacking. Locally grown with no harmful pesticides.",
        stock: 18,
        rating: 4.2,
        reviews: [
            {
                user: "Anna M.",
                rating: 4,
                comment: "Sweet and crispy!",
                date: "2025-08-29",
            },
        ],
    },
    {
        id: 3,
        name: "Rice",
        price: 1.2,
        image: "https://cdn.prod.website-files.com/66e9e86e939e026869639119/66fc4e47b5d69fb0deb88654_iStock-153737841-scaled.jpeg",
        address: "Poblacion, City Center",
        category: "Grains",
        farmerName: "Carlos Rodriguez",
        description:
            "Premium quality rice, perfect for daily meals. Well-milled and clean.",
        stock: 100,
        rating: 4.8,
        reviews: [
            {
                user: "Carlos R.",
                rating: 5,
                comment: "Best rice quality!",
                date: "2025-08-27",
            },
        ],
    },
    {
        id: 4,
        name: "Monggo",
        price: 12.0,
        image: "https://images.yummy.ph/yummy/uploads/2021/02/monggo.jpg",
        address: "Seaside Market, Zone 2",
        category: "Legumes",
        farmerName: "Pedro Gonzales",
        description:
            "High-quality mung beans, perfect for soup and other dishes.",
        stock: 12,
        rating: 4.3,
        reviews: [],
    },
    {
        id: 5,
        name: "Onion",
        price: 3.0,
        image: "https://cdn-prod.medicalnewstoday.com/content/images/articles/276/276714/red-and-white-onions.jpg",
        address: "Green Valley, Zone 7",
        category: "Spices",
        farmerName: "Ana Garcia",
        description: "Fresh onions with strong flavor, essential for cooking.",
        stock: 30,
        rating: 4.0,
        reviews: [],
    },
    {
        id: 6,
        name: "Potato",
        price: 1.5,
        image: "https://www.simplotfoods.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2F0dkgxhks0leg%2FRKiZ605RAV8kjDQnxFCWP%2Fb03b8729817c90b29b88d536bfd37ac5%2F9-Unusual-Uses-For-Potatoes.jpg%3Ffm%3Dwebp&w=1920&q=75",
        address: "Hilltop, Zone 8",
        category: "Root and Tuber",
        farmerName: "Roberto Fernandez",
        description: "Fresh potatoes perfect for frying, boiling, or baking.",
        stock: 45,
        rating: 4.6,
        reviews: [],
    },
];

// Helper function to find product by ID
export const findProductById = (id) =>
    products.find((p) => String(p.id) === String(id));
