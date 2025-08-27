import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import ConsumerSearch from "../components/ConsumerSearch.jsx";
import { useState } from "react";

function Favorites() {
  const [search, setSearch] = useState("");
  const favoriteProducts = [
    {
      id: 4,
      name: "Monggo",
      price: "$12.00",
      image: "https://images.yummy.ph/yummy/uploads/2021/02/monggo.jpg",
      address: "Seaside Market, Zone 2",
      category: "Legumes",
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
  ];

  const filteredFavorites = favoriteProducts.filter(
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
          <div className="w-full flex sm:justify-center my-1 mt-6">
            <h2 className="text-xl font-bold text-gray-600 self-start px-4 sm:px-0">
              Favorite Products
            </h2>
          </div>
          <div className="md:w-11/12 px-2 pb-24 sm:px-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full my-4 overflow-x-hidden overflow-y-auto scrollbar-hide">
            {filteredFavorites.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">
                No favorite products found.
              </div>
            ) : (
              filteredFavorites.map((product, index) => (
                <Link
                  to={`/product/${product.id}`}
                  key={index}
                  className="bg-white rounded-lg shadow-md flex flex-col items-center h-full"
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

export default Favorites;
