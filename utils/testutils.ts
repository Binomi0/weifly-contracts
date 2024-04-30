import { ethers } from "hardhat";
import {
  arrayify,
  hexConcat,
  hexDataSlice,
  hexlify,
  hexZeroPad,
  keccak256,
  parseEther,
} from "ethers/lib/utils";
import {
  BigNumber,
  BigNumberish,
  Contract,
  ContractReceipt,
  Wallet,
} from "ethers";
import { BytesLike, Hexable } from "@ethersproject/bytes";
import { expect } from "chai";
import { UserOperation } from "./UserOperation";
import { fillUserOpDefaults, packUserOp } from "./UserOp";
import { EntryPoint, IERC20 } from "../typechain-types";
import { AccountFactory } from "../typechain-types/contracts/SmartAccount";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PackedUserOperationStruct } from "../typechain-types/@account-abstraction/contracts/core/EntryPoint";

export const AddressZero = ethers.constants.AddressZero;
export const HashZero = ethers.constants.HashZero;
export const ONE_ETH = parseEther("1");
export const TWO_ETH = parseEther("2");
export const FIVE_ETH = parseEther("5");

export const tostr = (x: any): string => (x != null ? x.toString() : "null");

export function tonumber(x: any): number {
  try {
    return parseFloat(x.toString());
  } catch (e: any) {
    console.log("=== failed to parseFloat:", x, e.message);
    return NaN;
  }
}

// just throw 1eth from account[0] to the given address (or contract instance)
export async function fund(
  contractOrAddress: string | Contract,
  amountEth = "1",
): Promise<void> {
  let address: string;
  if (typeof contractOrAddress === "string") {
    address = contractOrAddress;
  } else {
    address = contractOrAddress.address;
  }
  await ethers.provider
    .getSigner()
    .sendTransaction({ to: address, value: parseEther(amountEth) });
}

export async function getBalance(address: string): Promise<number> {
  const balance = await ethers.provider.getBalance(address);
  return parseInt(balance.toString());
}

export async function getTokenBalance(
  token: IERC20,
  address: string,
): Promise<number> {
  const balance = await token.balanceOf(address);
  return parseInt(balance.toString());
}

let counter = 0;

// create non-random account, so gas calculations are deterministic
export function createAccountOwner(): Wallet {
  const privateKey = keccak256(
    Buffer.from(arrayify(BigNumber.from(++counter))),
  );
  return new ethers.Wallet(privateKey, ethers.provider);
  // return new ethers.Wallet('0x'.padEnd(66, privkeyBase), ethers.provider);
}

export function createAddress(): string {
  return createAccountOwner().address;
}

export function callDataCost(data: string): number {
  return ethers.utils
    .arrayify(data)
    .map((x) => (x === 0 ? 4 : 16))
    .reduce((sum, x) => sum + x);
}

export async function calcGasUsage(
  rcpt: ContractReceipt,
  entryPoint: EntryPoint,
  beneficiaryAddress?: string,
): Promise<{ actualGasCost: BigNumberish }> {
  const actualGas = await rcpt.gasUsed;
  const logs = await entryPoint.queryFilter(
    entryPoint.filters.UserOperationEvent(),
    rcpt.blockHash,
  );
  const { actualGasCost, actualGasUsed } = logs[0].args;
  console.log("\t== actual gasUsed (from tx receipt)=", actualGas.toString());
  console.log("\t== calculated gasUsed (paid to beneficiary)=", actualGasUsed);
  const tx = await ethers.provider.getTransaction(rcpt.transactionHash);
  console.log(
    "\t== gasDiff",
    actualGas.toNumber() - actualGasUsed.toNumber() - callDataCost(tx.data),
  );
  if (beneficiaryAddress != null) {
    expect(await getBalance(beneficiaryAddress)).to.eq(
      actualGasCost.toNumber(),
    );
  }
  return { actualGasCost };
}

// helper function to create the initCode to deploy the account, using our account factory.
export function getAccountInitCode(
  owner: string,
  factory: AccountFactory,
  salt = 0,
): BytesLike {
  return hexConcat([
    factory.address,
    factory.interface.encodeFunctionData("createBaseAccount", [owner]),
  ]);
}

export async function getAggregatedAccountInitCode(
  entryPoint: string,
  factory: AccountFactory,
  salt = 0,
): Promise<BytesLike> {
  // the test aggregated account doesn't check the owner...
  const owner = AddressZero;
  return hexConcat([
    factory.address,
    factory.interface.encodeFunctionData("createRecoverableAccount", [owner]),
  ]);
}

const panicCodes: { [key: number]: string } = {
  // from https://docs.soliditylang.org/en/v0.8.0/control-structures.html
  0x01: "assert(false)",
  0x11: "arithmetic overflow/underflow",
  0x12: "divide by zero",
  0x21: "invalid enum value",
  0x22: "storage byte array that is incorrectly encoded",
  0x31: ".pop() on an empty array.",
  0x32: "array sout-of-bounds or negative index",
  0x41: "memory overflow",
  0x51: "zero-initialized variable of internal function type",
};

export async function isDeployed(addr: string): Promise<boolean> {
  const code = await ethers.provider.getCode(addr);
  return code.length > 2;
}

export function packAccountGasLimits(
  verificationGasLimit: BigNumberish,
  callGasLimit: BigNumberish,
): string {
  return ethers.utils.hexConcat([
    hexZeroPad(hexlify(verificationGasLimit, { hexPad: "left" }), 16),
    hexZeroPad(hexlify(callGasLimit, { hexPad: "left" }), 16),
  ]);
}

export function packPaymasterData(
  paymaster: string,
  paymasterVerificationGasLimit: BytesLike | Hexable | number | bigint,
  postOpGasLimit: BytesLike | Hexable | number | bigint,
  paymasterData: string,
): string {
  return ethers.utils.hexConcat([
    paymaster,
    hexZeroPad(hexlify(paymasterVerificationGasLimit, { hexPad: "left" }), 16),
    hexZeroPad(hexlify(postOpGasLimit, { hexPad: "left" }), 16),
    paymasterData,
  ]);
}

export function unpackAccountGasLimits(accountGasLimits: string): {
  verificationGasLimit: number;
  callGasLimit: number;
} {
  return {
    verificationGasLimit: parseInt(accountGasLimits.slice(2, 34), 16),
    callGasLimit: parseInt(accountGasLimits.slice(34), 16),
  };
}

export interface ValidationData {
  aggregator: string;
  validAfter: number;
  validUntil: number;
}

export const maxUint48 = 2 ** 48 - 1;
export function parseValidationData(
  validationData: BigNumberish,
): ValidationData {
  const data = hexZeroPad(BigNumber.from(validationData).toHexString(), 32);

  // string offsets start from left (msb)
  const aggregator = hexDataSlice(data, 32 - 20);
  let validUntil = parseInt(hexDataSlice(data, 32 - 26, 32 - 20));
  if (validUntil === 0) {
    validUntil = maxUint48;
  }
  const validAfter = parseInt(hexDataSlice(data, 0, 6));

  return {
    aggregator,
    validAfter,
    validUntil,
  };
}

export function packValidationData(validationData: ValidationData): BigNumber {
  return BigNumber.from(validationData.validAfter)
    .shl(48)
    .add(validationData.validUntil)
    .shl(160)
    .add(validationData.aggregator);
}

// find the lowest number in the range min..max where testFunc returns true
export async function findMin(
  testFunc: (index: number) => Promise<boolean>,
  min: number,
  max: number,
  delta = 5,
): Promise<number> {
  if (await testFunc(min)) {
    throw new Error(`increase range: function already true at ${min}`);
  }
  if (!(await testFunc(max))) {
    throw new Error(
      `no result: function is false for max value in ${min}..${max}`,
    );
  }
  while (true) {
    const avg = Math.floor((max + min) / 2);
    if (await testFunc(avg)) {
      max = avg;
    } else {
      min = avg;
    }
    // console.log('== ', min, '...', max, max - min)
    if (Math.abs(max - min) < delta) {
      return max;
    }
  }
}

/**
 * find the lowest value that when creating a userop, still doesn't revert and
 * doesn't emit UserOperationPrefundTooLow
 * note: using eth_snapshot/eth_revert, since we actually submit calls to handleOps
 * @param f function that return a signed userop, with parameter-under-test set to "n"
 * @param min range minimum. the function is expected to return false
 * @param max range maximum. the function is expected to be true
 * @param entryPoint entrypoint for "fillAndSign" of userops
 */
export async function findUserOpWithMin(
  f: (n: number) => Promise<UserOperation>,
  expectExec: boolean,
  entryPoint: EntryPoint,
  min: number,
  max: number,
  delta = 2,
): Promise<number> {
  const beneficiary = ethers.provider.getSigner().getAddress();
  return await findMin(
    async (n) => {
      const snapshot = await ethers.provider.send("evm_snapshot", []);
      try {
        const userOp = await f(n);
        // console.log('== userop=', userOp)
        const rcpt = await entryPoint
          .handleOps([packUserOp(userOp)], beneficiary, { gasLimit: 1e6 })
          .then(async (r) => r.wait());
        if (
          rcpt?.events?.find((e) => e.event === "UserOperationPrefundTooLow") !=
          null
        ) {
          // console.log('min', n, 'UserOperationPrefundTooLow')
          return false;
        }
        if (expectExec) {
          const useropEvent = rcpt?.events?.find(
            (e) => e.event === "UserOperationEvent",
          );
          if (useropEvent?.args?.success !== true) {
            // console.log(rcpt?.events?.map((e: any) => ({ ev: e.event, ...objdump(e.args!) })))

            // console.log('min', n, 'success=false')
            return false;
          }
        }
        // console.log('min', n, 'ok')
        return true;
      } catch (e) {
        // console.log('min', n, 'ex=', decodeRevertReason(e as Error))
        return false;
      } finally {
        await ethers.provider.send("evm_revert", [snapshot]);
      }
    },
    min,
    max,
    delta,
  );
}

export async function getUserOp({
  sender,
  nonce,
  initCode,
  callData,
  callGasLimit = 800_000,
  verificationGasLimit = 800_000,
  preVerificationGas = 20_000,
  maxFeePerGas = ethers.utils.parseUnits("20", "gwei"),
  maxPriorityFeePerGas = ethers.utils.parseUnits("10", "gwei"),
}: {
  sender: string;
  nonce: BigNumber;
  initCode: string;
  callData: string;
  callGasLimit?: BigNumberish;
  verificationGasLimit?: BigNumberish;
  preVerificationGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
}) {
  const filledUserOp = fillUserOpDefaults({
    sender,
    nonce,
    initCode,
    callData,
  });

  const userOp = {
    ...filledUserOp,
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    signature: "0x",
  };

  return userOp;
}

export const getSender = async (entryPoint: EntryPoint, initCode: string) =>
  entryPoint.getSenderAddress(initCode).catch((err) => {
    if (err.data) {
      return `0x${err.data.slice(-40)}`;
    } else if (err.error) {
      return `0x${err.error.data.data.slice(-40)}`;
    }
    throw new Error("Wrong data from getSenderAddress");
  });

export const getBaseInitCode = (
  accountFactory: AccountFactory,
  account: string,
) =>
  accountFactory.address +
  accountFactory.interface
    .encodeFunctionData("createBaseAccount", [account])
    .slice(2);

export const getInitCode = (accountFactory: AccountFactory, account: string) =>
  accountFactory.address +
  accountFactory.interface
    .encodeFunctionData("createRecoverableAccount", [account])
    .slice(2);

export const signUserOp = async (
  entryPoint: EntryPoint,
  packedUserOp: PackedUserOperationStruct,
  owner: SignerWithAddress,
): Promise<PackedUserOperationStruct> => {
  const userOpHash = await entryPoint.getUserOpHash(packedUserOp);
  packedUserOp.signature = await owner.signMessage(
    ethers.utils.arrayify(userOpHash),
  );

  return packedUserOp;
};
