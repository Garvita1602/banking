import DoughnutChart from './DoughnutChart';
import CountUp from 'react-countup'
//import React from 'react'
import AnimatedCounter from './AnimatedCounter';

const TotalBalancedBox=({
    accounts=[],totalBanks,totalCurrentBalance
}:TotalBalanceBoxProps)=>{
    return(
        <section className='total-balance'>
            <div className='total-balance-chart'>
                <DoughnutChart accounts={accounts} />
            </div>
            <div className='flex flex-col gap-6'>
                <h2 className='header-2'>
                    Bank Accounts:{totalBanks}
                </h2>
                <div className='flex flex-col-gap-2'>
                    <p className='total-balance-label'>
                        Total Current Balance
                    </p>
                    <div className='total-balance-amount flex-center gap-2'>
                        <AnimatedCounter amount=
                        {totalCurrentBalance}/>
                        <CountUp end={100} />
                        
                    </div>

                </div>
                
            </div>
        </section>
    )
}
export default TotalBalancedBox