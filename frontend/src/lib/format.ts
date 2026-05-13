import { formatUnits, parseEther } from "ethers";

// wallet
export function shortAddress(addr: string | null | undefined, n = 4): string {
    if(!addr) return "-";
    return addr.length <=2 + n * 2 ? addr : `${addr.slice(0, 2+ n)}...{${addr.slice(-n)}}`;
}

// 18-decimals
export function fmtRcred(amount: bigint | string | undefined) : string {
    if (amount == undefined) return "-";
    const s = formatUnits(amount, 18);
    return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

export function toWei(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined || value === "") return 0n;
  return parseEther(String(value));
}