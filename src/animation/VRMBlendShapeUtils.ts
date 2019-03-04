const regexToBlendShapeGroupName: Array<[RegExp, string]> = [
  [new RegExp('^(Neutral|base)$'), 'Neutral'],
  [new RegExp('^(A|a|あ)$'), 'A'],
  [new RegExp('^(I|i|い)$'), 'I'],
  [new RegExp('^(U|u|う)$'), 'U'],
  [new RegExp('^(E|e|え)$'), 'E'],
  [new RegExp('^(O|o|お)$'), 'O'],
  [new RegExp('^([Bb]link|まばたき)$'), 'Blink'],
  [new RegExp('^([Bb]link_[Ll]|ウィンク)$'), 'Blink_L'],
  [new RegExp('^([Bb]link_[Rr]|ウィンク右)$'), 'Blink_R'],
  [new RegExp('^([Jj]oy)$'), 'Joy'],
  [new RegExp('^([Aa]ngry|怒り)$'), 'Angry'],
  [new RegExp('^([Ss]orrow|困る)$'), 'Sorrow'],
  [new RegExp('^([Ff]un|笑い)$'), 'Fun'],
  [new RegExp('^([Ll]ook[Uu]p)$'), 'LookUp'],
  [new RegExp('^([Ll]ook[Dd]own)$'), 'LookDown'],
  [new RegExp('^([Ll]ook[Ll]eft)$'), 'LookLeft'],
  [new RegExp('^([Ll]ook[Rr]ight)$'), 'LookRight'],
];

export abstract class VRMBlendShapeUtils {
  public static stringToBlendShapeGroupName(s: string): string {
    const r = regexToBlendShapeGroupName.find(e => e[0].test(s));
    if (!r) {
      return undefined;
    }
    return r[1];
  }
}
