import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-dark">
            cavacore
          </Link>
          <nav className="flex gap-4">
            <Link 
              to="/horses" 
              className="text-gray-600 hover:text-primary-dark"
            >
              Horses
            </Link>
            <Link 
              to="/horses/create" 
              className="text-gray-600 hover:text-primary-dark"
            >
              Add Horse
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
