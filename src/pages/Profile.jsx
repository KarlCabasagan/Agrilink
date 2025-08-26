import { Icon } from "@iconify/react";
import NavigationBar from "../components/NavigationBar";

function Profile() {
  return (
    <>
      <div className="h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
        <div className="w-11/12 bg-white rounded-lg shadow-md m-4 mb-3">
          <div className="w-full h-24 bg-primary flex justify-center items-end rounded-t-lg">
            <div className="bg-white rounded-full translate-y-1/2 p-1 shadow-md">
              <img
                src="https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg"
                alt="Profile"
                className="rounded-full object-cover w-32 h-32"
              />
            </div>
          </div>
          <div className="p-4 pt-20">
            <div className="flex justify-between">
              <div className="max-w-[calc(100%-5rem)]">
                <h2 className="text-2xl text-text font-bold mb-2">John Doe</h2>
                <p className="text-gray-600 mb-4 truncate">
                  johndoe@example.com
                </p>
                <p className="text-gray-600 truncate">
                  Maria Cristina, Purok 9 Zone 3
                </p>
                <p className="text-gray-600 truncate">+63 912 345 6789</p>
              </div>
              <div className="flex items-center pl-4 border-l-[1px] border-gray-300">
                <button className="cursor-pointer text-text">
                  <Icon icon="mingcute:edit-line" width="24" height="24" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-11/12 bg-white p-4 rounded-lg shadow-md">
          <button className="w-full flex border-b border-gray-300 py-4 px-1 text-left hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <Icon
                icon="mingcute:shopping-cart-1-line"
                width="24"
                height="24"
              />
              <span className="ml-2">My Cart</span>
            </div>
            <Icon
              icon="mingcute:right-line"
              width="24"
              height="24"
              className="ml-auto"
            />
          </button>
          <button className="w-full flex border-b border-gray-300 py-4 px-1 text-left hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <Icon icon="ic:baseline-favorite-border" width="24" height="24" />
              <span className="ml-2">Favorite Products</span>
            </div>
            <Icon
              icon="mingcute:right-line"
              width="24"
              height="24"
              className="ml-auto"
            />
          </button>
          <button className="w-full flex border-b border-gray-300 py-4 px-1 text-left hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <Icon icon="mingcute:truck-line" width="24" height="24" />
              <span className="ml-2">My Orders</span>
            </div>
            <Icon
              icon="mingcute:right-line"
              width="24"
              height="24"
              className="ml-auto"
            />
          </button>
          <button className="w-full flex border-b border-gray-300 my-2 py-4 px-1 text-left hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <Icon
                icon="mingcute:history-anticlockwise-line"
                width="24"
                height="24"
              />
              <span className="ml-2">Order History</span>
            </div>
            <Icon
              icon="mingcute:right-line"
              width="24"
              height="24"
              className="ml-auto"
            />
          </button>
          <button className="w-full flex border-b border-gray-300 my-2 py-4 px-1 text-left text-primary hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <Icon icon="mingcute:paper-line" width="24" height="24" />
              <span className="ml-2">Apply to be a Seller</span>
            </div>
            <Icon
              icon="mingcute:right-line"
              width="24"
              height="24"
              className="ml-auto"
            />
          </button>
        </div>
        <button className="w-11/12 text-red-600 bg-white flex border-b border-gray-300 shadow-md my-6 py-4 px-5 text-left hover:bg-gray-100 transition-colors rounded-lg">
          <div className="flex items-center">
            <Icon icon="mingcute:delete-3-line" width="24" height="24" />
            <span className="ml-2">Delete Account</span>
          </div>
          <Icon
            icon="mingcute:right-line"
            width="24"
            height="24"
            className="ml-auto"
          />
        </button>
        <NavigationBar />
      </div>
    </>
  );
}

export default Profile;
