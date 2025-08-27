import { useParams } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";

function Product() {
  const { id } = useParams();
  const products = [
    {
      id: 1,
      name: "Carrot",
      price: "$2.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Maria Cristina, Purok 9 Zone 3",
      category: "Vegetables",
    },
    {
      id: 2,
      name: "Apple",
      price: "$8.00",
      image:
        "https://assets.clevelandclinic.org/transform/LargeFeatureImage/cd71f4bd-81d4-45d8-a450-74df78e4477a/Apples-184940975-770x533-1_jpg",
      address: "Zone 4, Barangay 5",
      category: "Fruits",
    },
    {
      id: 3,
      name: "Rice",
      price: "$1.20",
      image:
        "https://cdn.prod.website-files.com/66e9e86e939e026869639119/66fc4e47b5d69fb0deb88654_iStock-153737841-scaled.jpeg",
      address: "Poblacion, City Center",
      category: "Grains",
    },
    {
      id: 4,
      name: "Monggo",
      price: "$12.00",
      image: "https://images.yummy.ph/yummy/uploads/2021/02/monggo.jpg",
      address: "Seaside Market, Zone 2",
      category: "Legumes",
    },
    {
      id: 5,
      name: "Onion",
      price: "$3.00",
      image:
        "https://cdn-prod.medicalnewstoday.com/content/images/articles/276/276714/red-and-white-onions.jpg",
      address: "Green Valley, Zone 7",
      category: "Spices",
    },
    {
      id: 6,
      name: "Potato",
      price: "$1.50",
      image:
        "https://www.simplotfoods.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2F0dkgxhks0leg%2FRKiZ605RAV8kjDQnxFCWP%2Fb03b8729817c90b29b88d536bfd37ac5%2F9-Unusual-Uses-For-Potatoes.jpg%3Ffm%3Dwebp&w=1920&q=75",
      address: "Hilltop, Zone 8",
      category: "Root and Tuber",
    },
  ];

  const product = products.find((p) => String(p.id) === String(id));

  return (
    <>
      <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
        {product ? (
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-10 flex flex-col items-center">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-60 object-cover rounded-md mb-4"
            />
            <h2 className="text-2xl font-bold mb-2 text-center">
              {product.name}
            </h2>
            <p className="text-primary text-xl font-semibold mb-2">
              {product.price}
            </p>
            <p className="text-gray-600 mb-2">Category: {product.category}</p>
            <p className="text-gray-500 mb-2">Address: {product.address}</p>
          </div>
        ) : (
          <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
            <p className="text-gray-400 text-lg">Product not found.</p>
          </div>
        )}
        <NavigationBar />
      </div>
    </>
  );
}

export default Product;
