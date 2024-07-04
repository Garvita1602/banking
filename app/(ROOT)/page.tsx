import React from 'react'
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalancedBox from '@/components/TotalBalanceBox';
import RightSidebar from '@/components/RightSidebar';

const Home=()=>{
    const loggedIn={firstName: 'Garvita', lastName:'Jhanwar',email:'garvitajhawar10@gmail.com'};
    return(
        <section className='home'>
            <div className='home-content'>
                <header className='home-header'>
                    <HeaderBox
                    type="greeting"
                    title="Welcome"
                    user={loggedIn?.firstName || 'Guest'}
                    subtext="Access and manage your account and transactions efficiently."
                    />
                    <TotalBalancedBox
                    accounts={[]}
                    totalBanks={1}
                    totalCurrentBalance={12500.35}
                    />
                </header>
                RECENT TRANSACTIONS 
            </div>
            <RightSidebar
              user={loggedIn}
              transactions={[]}
              banks={[{ currentBalance:123.50},{currentBalance:123.50}]}
            />
        </section>    
    )
}
export default Home