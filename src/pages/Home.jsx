import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import ConsumerSearch from "../components/ConsumerSearch.jsx";

function Home() {
  const categories = [
    { name: "All", icon: "mdi:apps-box" },
    { name: "Vegetables", icon: "twemoji:carrot" },
    { name: "Fruits", icon: "twemoji:red-apple" },
    { name: "Grains", icon: "twemoji:cooked-rice" },
    { name: "Spices", icon: "twemoji:onion" },
    { name: "Root and Tuber", icon: "twemoji:potato" },
    { name: "Legumes", icon: "twemoji:beans" },
  ];
  const [selectedCategory, setSelectedCategory] = useState(categories[0].name);
  const [search, setSearch] = useState("");

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

  const filteredProducts = (
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory)
  ).filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
        <ConsumerSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-10/12 mt-[120px] flex flex-col items-center overflow-x-hidden">
          <div className="flex overflow-x-auto gap-6 px-4 py-2 scrollbar-hide w-full sm:w-auto md:max-w-4/5 bg-white rounded-xl">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center min-w-[80px] cursor-pointer text-center ${
                  selectedCategory === category.name
                    ? "bg-primary/10 rounded-lg"
                    : ""
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Icon
                  icon={category.icon}
                  width="40"
                  height="40"
                  color={
                    selectedCategory === category.name ? "#1976D2" : "#8A8A8A"
                  }
                />
                <span
                  className={`mt-2 text-sm font-medium truncate max-w-[80px] ${
                    selectedCategory === category.name
                      ? "text-primary"
                      : "text-text"
                  }`}
                >
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full flex sm:justify-center my-1 mt-6">
            <h2 className="text-xl font-bold text-gray-600 self-start px-4 sm:px-0">
              {selectedCategory} Products
            </h2>
          </div>
          <div className="md:w-11/12 px-2 pb-24 sm:px-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full my-4 overflow-x-hidden overflow-y-auto scrollbar-hide">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <Link
                  to={`/product/${product.id}`}
                  key={index}
                  className="bg-white rounded-lg shadow-md flex flex-col items-center h-full cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md mb-2 rounded-b-none"
                  />
                  <div className="w-full flex flex-col p-3 pt-0 flex-grow">
                    <h3 className="font-medium text-text line-clamp-2 sm:line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="w-full flex justify-between items-center mb-2">
                      <p className="text-primary font-semibold mt-2">
                        {product.price}
                      </p>
                      <p className="text-sm mt-2.5 text-gray-500">100 sold</p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex items-center text-gray-600">
                        <Icon
                          icon="mdi:map-marker"
                          width="14"
                          height="14"
                          className="mr-2 min-w-[14px]"
                        />
                        <span className="text-sm line-clamp-1">
                          {product.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <NavigationBar />
      </div>
    </>
  );
}

export default Home;
