import { Icon } from "@iconify/react";

function ConsumerSearch({ value, onChange }) {
  return (
    <div className="fixed top-0 left-0 w-full pt-8 bg-primary z-[1000] flex items-center justify-center py-4">
      <div className="relative w-3/4 max-w-lg ml-4">
        <button
          type="button"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-label="Search"
        >
          <Icon
            icon="streamline-sharp:magnifying-glass-solid"
            width="24"
            height="24"
          />
        </button>
        <input
          type="text"
          className="bg-white w-full p-3 pl-12 rounded-md text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          placeholder="Search..."
          value={value}
          onChange={onChange}
        />
      </div>
      <div className="relative">
        <button
          type="button"
          className="ml-2 text-white px-4 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium"
          aria-label="Cart"
        >
          <Icon icon="ic:baseline-shopping-cart" width="28" height="28" />
        </button>
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full cursor-pointer select-none">
          0
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          className="ml-2 text-white px-4 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium"
          aria-label="Messages"
        >
          <Icon icon="ic:baseline-message" width="28" height="28" />
        </button>
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full cursor-pointer select-none">
          0
        </div>
      </div>
    </div>
  );
}

export default ConsumerSearch;
