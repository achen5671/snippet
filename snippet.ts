 // Business Rule:
// * A pack can only have one rare OR one legendary
// * A pack always have unique items
// * A lootpack should always have at least 2 commons, 1 rare and 1 legendary
// example:
//    - Valid: (2 common, 1 rare) or (2 common, 1 legendary), or (3 commons)
//    - Not valid: 2+ rare in a pack, or 2+ legendary
// This means we must make sure enough commons are in the database before creating a pack
getItems = async (lootpackId: string, itemsByRarity: any, trx: Transaction) => {
const { packSize, commonsPerPack, raresOrLegendariesPerPack } = styleTypeAttributes.threePack;
const packResult = <Array<LootpackItem>>[];
// Formula to check if there is enough commons. If there is not enough commons, force a rare or legendary
//  Formula:
//    * commons >= (rare + legendary) * commonPerPack
const enoughCommons = itemsByRarity.common >= (itemsByRarity.rare + itemsByRarity.legendary) * commonsPerPack;
const commonSeriesCountInLootpack = await LootpackItemSeriesRepository.getRaritysInLootpack(lootpackId, 'common');

// If there are only two commons series type in a lootpack, then we have to force a rare or a legendary to a pack
const raritys = (!enoughCommons || commonSeriesCountInLootpack.length <= 2) ? ['rare', 'legendary'] : ['common', 'rare', 'legendary'];

// get an array of 'packSize' items
while (packResult.length < packSize) {
    let nextLootpackItemArray: LootpackItem[] = [];
    const currentRarities = packResult.map((value) => value?.lootpackItemSeries?.rarity);
    const rareAndLegendaryCurrentLength = currentRarities?.filter((rarity) => (rarity) && ['rare', 'legendary'].includes(rarity)).length;
    const ignoreSeries = packResult.map((d) => d.lootpackItemSeriesId);
    if (rareAndLegendaryCurrentLength < raresOrLegendariesPerPack) {
    nextLootpackItemArray = await LootpackItemRepository.getRandomItemsByRarity(lootpackId, raritys, 1, trx, ignoreSeries);
    } else {
    const remainingCommonsLeft = packSize - packResult.length;
    nextLootpackItemArray = await LootpackItemRepository.getRandomItemsByRarity(lootpackId, ['common'], remainingCommonsLeft, trx, ignoreSeries);
    }
    if (nextLootpackItemArray.length === 0) throw new BadRequestError(`No Valid Series Found on lootpackId:${lootpackId} | ignoreSeries: ${ignoreSeries}`);
    packResult.push(...nextLootpackItemArray);
}

return packResult;
};
