import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();


describe("TokenSale", function() {

    const RATE = 100n; // 1 ETH = 100 RCRED
  
    async function deploy() {
        const [deployer, alice, bob] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("RobotCredits");
        const token = await Factory.deploy(deployer.address);
        await token.waitForDeployment();

        const Sale = await ethers.getContractFactory("TokenSale");
        const sale = await Sale.deploy(
            await token.getAddress(),
            RATE,
            deployer.address,
        );

        await sale.waitForDeployment();
        

        await token.transferOwnership(await sale.getAddress());

        return {token, sale, deployer, alice, bob}
    }

    it("mints RCRED ad the configured rate when ETH is sent via buyTokens()", async function() {
        const { sale, token, alice} = await deploy();
        const ethIn = ethers.parseEther("0.5");
        const expected = ethIn * RATE;
        
        await expect((sale.connect(alice) as typeof sale).buyTokens({ value: ethIn }))
            .to.emit(sale, "TokensPurchased")
            .withArgs(alice.address, ethIn, expected);


        expect(await token.balanceOf(alice.address)).to.equal(expected);
        expect(await ethers.provider.getBalance(await sale.getAddress()))
            .to.equal(ethIn,);
    });

    // TODO: ....


})