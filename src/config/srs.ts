/** Leitner 盒子间隔（天）：索引 = 盒子号。box6 答对后毕业。 */
export const BOX_INTERVALS: readonly number[] = [0, 1, 2, 4, 7, 15, 30]

export const MAX_BOX = 6

/** 答错时下降的盒子数 */
export const WRONG_DROP = 2

/** box0（新词）需要累计答对次数才升入 box1 */
export const BOX0_REQUIRED_HITS = 2

/** 毕业词答错后回落到的盒子 */
export const GRADUATED_WRONG_BOX = 4
