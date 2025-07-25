import React from 'react';
import '../App.css'
// import Sidebar from './navbar/Sidebar';
import Navbar from './Navbar';
import MainContent from '../MainContent';

const AuthPage = ({ nav }) => {
    return (
        <div className='w-full h-screen'>
            <div className="h-full block md:flex w-full">
                {/* <div className="heading w-full flex align-center justify-center bg-red-300"><Header /></div> */}
                <div className="sidebar md:w-1/6 w-full bg-[#030027] px-5 overflow-y-scroll min-h-10 align-center">
                    <Navbar nav={nav} />
                </div>
                <div className='min-h-custom main-content w-full md:w-5/6 bg-[#8D99AE] p-2 overflow'>
                    {/* <Header /> */}
                    <MainContent nav={nav} />
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
