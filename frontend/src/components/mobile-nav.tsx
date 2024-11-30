import { Link } from 'react-router-dom';
import { Home, Search, PlusCircle, User } from 'lucide-react';
// import { cn } from '@/lib/utils';
import { useState } from 'react';

export function MobileNav() {
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleSearchClick = () => {
    setShowSearchMenu(!showSearchMenu);
    setShowAddMenu(false);
  };

  const handleAddClick = () => {
    setShowAddMenu(!showAddMenu);
    setShowSearchMenu(false);
  };

  // const createMenu = [
  //   {
  //     href: '/horses/create',
  //     label: 'Add',
  //     icon: PlusCircle
  //   },
  //   {
  //     href: '/deals/create',
  //     label: 'Add',
  //     icon: PlusCircle
  //   }
  // ]

  // const SearchMenu = [
  //   {
  //     href: '/horses',
  //     label: 'Search',
  //     icon: PlusCircle
  //   },
  //   {
  //     href: '/deals',
  //     label: 'Search',
  //     icon: PlusCircle
  //   }
  // ]

  // const routes = [
  //   {
  //     href: '/',
  //     label: 'Home',
  //     icon: Home
  //   },
  //   createMenu,
  //   SearchMenu,
  //   {
  //     href: '/login',
  //     label: 'Profile',
  //     icon: User
  //   }
  // ];

  // const toggleSubMenu = () => {
  //   setSubMenuOpen(!isSubMenuOpen);
  // };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <nav className="bg-white border-t h-16 flex items-center px-4 shadow-lg">
          <div className="w-full flex justify-around items-center">
            <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Home</span>
            </Link>
            <button onClick={handleSearchClick} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Search</span>
            </button>
            <button onClick={handleAddClick} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <PlusCircle className="h-5 w-5" />
              <span className="text-xs font-medium">Add</span>
            </button>
            <Link to="/login" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </nav>
      </div>

      {showSearchMenu && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm">
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold text-center">Search</h3>
              <Link to="/horses" className="block w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowSearchMenu(false)}>
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Search Horses</span>
                </div>
              </Link>
              <Link to="/deals" className="block w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowSearchMenu(false)}>
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Search Deals</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {showAddMenu && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm">
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold text-center">Create New</h3>
              <Link to="/horses/create" className="block w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowAddMenu(false)}>
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  <span>Add Horse</span>
                </div>
              </Link>
              <Link to="/deals/create" className="block w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowAddMenu(false)}>
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  <span>Add Deal</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}