import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { CartCountContext } from "../context/CartCountContext.jsx";
import { UnreadConversationsContext } from "../context/UnreadConversationsContext.jsx";

function ConsumerSearch({
    value,
    onChange,
    placeholder = "Search products…",
}) {
    const { user } = useContext(AuthContext);
    const { cartCount } = useContext(CartCountContext);
    const { unreadConversationCount } = useContext(UnreadConversationsContext);

    return (
        <div className="w-full bg-white shadow-xs border-b border-slate-200 sticky top-0 z-40">
            <div className="flex items-center gap-3 px-4 py-2.5 max-w-6xl mx-auto">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Icon
                        icon="mingcute:search-line"
                        width="20"
                        height="20"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-colors duration-150"
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                    />
                </div>

                {/* Cart Button: 44x44px target with active press */}
                <Link
                    to="/cart"
                    className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-700"
                    aria-label={`Cart with ${cartCount} items`}
                >
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="22"
                        height="22"
                    />
                    {cartCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-700 text-white text-[11px] font-semibold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-xs">
                            {cartCount}
                        </span>
                    )}
                </Link>

                {/* Messages Button: 44x44px target with active press */}
                <Link
                    to="/messages"
                    className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-700"
                    aria-label={`Messages with ${unreadConversationCount} unread`}
                >
                    <Icon
                        icon="mingcute:message-3-line"
                        width="22"
                        height="22"
                    />
                    {unreadConversationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-700 text-white text-[11px] font-semibold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-xs">
                            {unreadConversationCount}
                        </span>
                    )}
                </Link>
            </div>
        </div>
    );
}

export default ConsumerSearch;
