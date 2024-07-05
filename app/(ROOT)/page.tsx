import React from 'react'
import HeaderBox from '@/components/ui/HeaderBox'
import TotalBalancedBox from '@/components/TotalBalanceBox';
import RightSidebar from '@/components/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home=async()=>{
    const loggedIn=await getLoggedInUser();
    return(
        <section className='home'>
            <div className='home-content'>
                <header className='home-header'>
                    <HeaderBox
                    type="greeting"
                    title="Welcome"
                    user={loggedIn?.name || 'Guest'}
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