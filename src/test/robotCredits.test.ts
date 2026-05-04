import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe("RobotCredits", function() {
    async function deploy() {
        const [deployer, alice, bob] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("RobotCredits");
        const token = await Factory.deploy(deployer.address);
        await token.waitForDeployment();

        return { token, deployer, alice, bob };
    }

    it("has the exoected name, symbol and 18 decimals", async function() {
        const { token } = await deploy();
        expect(await token.name()).to.equal("Robot Credits");
        expect(await token.symbol()).to.equal("RCRED");
        expect(await token.decimals()).to.equal(18);
        expect(await token.totalSupply()).to.equal(0n);
    });
    
    it("lets the owner mint tokens to an address", async function() {
        const { token, alice } = await deploy();
        const amount = ethers.parseEther("25");

        await expect(token.mint(alice.address, amount))
            .to.emit(token, "Transfer")
            .withArgs(ethers.ZeroAddress, alice.address, amount);

        expect(await token.balanceOf(alice.address)).to.equal(amount);
        expect(await token.totalSupply()).to.equal(amount);
    })


    it("reject mint() from non-owner", async function() {
        const { token, alice, bob } = await deploy();
        
        await expect((token.connect(alice) as typeof token).mint(bob.address, 1n),)
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("supports the standard ERC-20 transfer flow", async function() {
         const { token, deployer, alice, bob } = await deploy();
         await token.mint(alice.address, ethers.parseEther("10"));

         await (token.connect(alice) as typeof token).transfer(
            bob.address,
            ethers.parseEther("2"),
         );

         expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("8"));
         expect(await token.balanceOf(bob.address)).to.equal(ethers.parseEther("2"));

         expect(await token.balanceOf(deployer.address)).to.equal(0n);
    });

})

