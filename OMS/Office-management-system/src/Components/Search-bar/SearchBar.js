import './SearchBar.css'
import { useState } from "react";
import { FiSearch, FiBell, FiUser } from "react-icons/fi";

const SearchBar = ({ onSearch }) => {

  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);

    if (onSearch) { // Ensure onSearch exists before calling it
      onSearch(newSearchTerm);
    }
  };

    return (
    <div className="outer-container">
            <div className="search-container">
              <div className="searchbar">
                <input
                  type="text"
                  placeholder="Search for anything..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleInputChange}
                  style={{borderRadius:"30px"}}
                />
                <button className="search-button">
                  <FiSearch size={16} />
                </button>
              </div>
              <div className="top-bar-icons">
                <button className="notification-button">
                  <FiBell size={20} />
                </button>
                <button className="profile-button">
                  <FiUser size={20} />
                </button>
                </div>
              </div>
            </div>
    )
}

export default SearchBar;