import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import ConsumerSearch from "../components/ConsumerSearch.jsx";
import { useState } from "react";

function Favorites() {
  const [search, setSearch] = useState("");
  const favoriteProducts = [
    {
      name: "Carrots Fresh From Farm | Very Fresh Carrots | Buy Here Now SSSD",
      price: "$2.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Maria Cristina, Purok 9 Zone 3",
    },
    {
      name: "Chicken",
      price: "$8.00",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Zone 4, Barangay 5",
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
                <div
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
                </div>
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
