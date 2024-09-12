export abstract class OpCodes {
    static increment = 0xf3aae35;
    static deposit = 0xff1711a;
    static withdraw = 0x78578a6;

    static deployNft = 0x677e3550; // 1736324432
    static batchDeployNft = 0x622e445a; // 1647199322
    static changeOwner = 0x6bbe115a; // 1807618394
    static getRoyaltyParams = 0x693d3950; // 1765620048
    static reportRoyaltyParams = 0xa8cb00ad; // 2831876269

    static transfer = 0x5fcc3d14; // 1607220500
    static ownershipAssigned = 0x05138d91; // 85167505
    static excesses = 0xd53276db; // 3576854235
    static getStaticData = 0x2fcb26a2; // 801842850
    static reportStaticData = 0x8b771735; // 2339837749
}