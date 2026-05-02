"""Mock OCR provider returning deterministic fixtures.

Used when no GEMINI_API_KEY is set, and for the demo-sample endpoint.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path

from app.services.ocr.base import OCRProvider, OCRResult


# Built-in demo fixtures: realistic Japanese OTC / supplement / pharmacy text.
DEMO_FIXTURES: dict[str, str] = {
    "otc-cold": """\
パブロンS錠 (指定第2類医薬品)

【効能・効果】
かぜの諸症状(鼻水、鼻づまり、くしゃみ、のどの痛み、せき、たん、
悪寒、発熱、頭痛、関節の痛み、筋肉の痛み)の緩和

【用法・用量】
次の量を食後なるべく30分以内に水又はぬるま湯で服用してください。
成人(15歳以上) 1回3錠 1日3回
7歳以上15歳未満 1回2錠 1日3回
7歳未満は服用しないこと

【使用上の注意】
してはいけないこと
1. 次の人は服用しないこと
   本剤又は本剤の成分によりアレルギー症状を起こしたことがある人
2. 本剤を服用している間は、次のいずれの医薬品も服用しないこと
   他のかぜ薬、解熱鎮痛薬、鎮静薬、鎮咳去痰薬

相談すること
1. 次の人は服用前に医師、薬剤師又は登録販売者に相談すること
   妊婦又は妊娠していると思われる人
   授乳中の人
   高齢者

【成分・分量】
1日量(9錠)中
アセトアミノフェン 900mg
グアイフェネシン 250mg

【保管及び取扱い上の注意】
直射日光の当たらない湿気の少ない涼しい所に密栓して保管してください。
""",
    "otc-painkiller": """\
ロキソニンS (第1類医薬品)

【効能・効果】
頭痛、月経痛(生理痛)、歯痛、抜歯後の疼痛、咽喉痛、腰痛、関節痛、
神経痛、筋肉痛、肩こり痛、耳痛、打撲痛、骨折痛、ねんざ痛、外傷痛
の鎮痛
悪寒、発熱時の解熱

【用法・用量】
成人(15歳以上)1回1錠を、なるべく空腹時を避けて服用してください。
服用間隔は4時間以上おいてください。
1日2回まで、症状があるときには3回目を服用できます。
15歳未満の小児は服用しないこと。

【使用上の注意】
■警告■
本剤を服用中は飲酒しないでください。

してはいけないこと
1. 次の人は服用しないこと
   妊婦又は妊娠していると思われる人
   出産予定日12週以内の妊婦
2. 本剤を服用している間は、他の解熱鎮痛薬、かぜ薬、鎮静薬を服用しないこと

相談すること
1. 次の人は服用前に医師、薬剤師又は登録販売者に相談すること
   高齢者、肝機能障害、腎機能障害のある人

【成分・分量】
1錠中
ロキソプロフェンナトリウム水和物 68.1mg
""",
    "supplement-vitamin": """\
ネイチャーメイド マルチビタミン (栄養機能食品)

栄養補助食品 サプリメント

【1日の摂取目安量】
1日1粒を目安に水またはぬるま湯と共にお召し上がりください。

【栄養成分表示】1粒(1.31g)あたり
エネルギー 4.94kcal
たんぱく質 0.05g
ビタミンA 770μg
ビタミンB1 1.2mg
ビタミンB2 1.4mg
ビタミンC 100mg
ビタミンD 5.0μg
ビタミンE 6.3mg

【摂取上の注意】
・本品は、多量摂取により疾病が治癒したり、より健康が増進するものではありません。
・1日の摂取目安量を守ってください。
・乳幼児・小児の手の届かないところに保管してください。
・妊娠・授乳中の方、治療を受けている方は、お医者様にご相談の上お召し上がりください。

【保管方法】
直射日光、高温多湿を避けて保管してください。
""",
    "pharmacy-instruction": """\
薬剤情報提供書

患者氏名: 〇〇 〇〇 様
処方医: △△クリニック  △△医師
調剤年月日: 2024年5月10日
薬局名: ○○薬局

【お薬の説明】

1. アムロジピン錠 5mg
   血圧を下げるお薬です。
   1日1回 朝食後 1錠

2. ロスバスタチン錠 2.5mg
   コレステロールを下げるお薬です。
   1日1回 夕食後 1錠

【服薬指導】
・毎日決まった時間に服用してください。
・飲み忘れた場合は、気がついた時にすぐに服用してください。
  ただし、次の服用時間が近い場合は1回分を飛ばしてください。
・グレープフルーツジュースとの併用は避けてください。
・体調の変化、副作用が疑われる症状が出た場合は、
  医師又は薬剤師に相談してください。

【保管】
直射日光を避け、湿気の少ない涼しい所に保管してください。
小児の手の届かない所に保管してください。
""",
    "high-risk-warning": """\
ワーファリン錠 1mg (処方箋医薬品)

【警告】
本剤は重篤な出血を引き起こすおそれがあります。
定期的な血液検査(PT-INR)が必須です。
医師の指示なく服用を中止しないでください。

【効能・効果】
血栓塞栓症(静脈血栓症、心筋梗塞症、肺塞栓症、脳塞栓症、緩徐に
進行する脳血栓症等)の治療及び予防

【用法・用量】
通常、成人にはワルファリンカリウムとして1〜5mgを1日1回経口投与する。
投与量は、血液凝固能検査(プロトロンビン時間及びトロンボテスト)の
検査値に基づいて、本剤に対する感受性は個人差が大きいので、
投与量は個別に設定すること。

【使用上の注意】
重要な基本的注意
1. 出血傾向の増強の可能性があるため、定期的に血液凝固能検査を行うこと
2. 次の患者には投与しないこと
   出血している患者
   出血する可能性のある患者
   重篤な肝障害、腎障害のある患者
   妊婦又は妊娠している可能性のある婦人

重大な副作用
出血(脳出血等の頭蓋内出血、消化管出血、後腹膜出血等)
皮膚壊死
肝機能障害、黄疸

【成分】
ワルファリンカリウム 1mg
""",
}


class MockOCRProvider(OCRProvider):
    name = "mock"

    def __init__(self, fixtures: dict[str, str] | None = None) -> None:
        self._fixtures = fixtures or DEMO_FIXTURES

    def get_fixture(self, demo_id: str) -> str:
        text = self._fixtures.get(demo_id)
        if text is None:
            raise KeyError(f"Unknown demo id: {demo_id}")
        return text

    async def extract(self, file_path: str, content_type: str) -> OCRResult:
        # For uploaded files, deterministically pick a fixture by file hash
        # so demo behaviour is reproducible without real OCR.
        digest = ""
        try:
            with open(file_path, "rb") as fh:
                digest = hashlib.sha1(fh.read()).hexdigest()
        except OSError:
            pass

        keys = list(self._fixtures.keys())
        if not keys:
            return OCRResult(raw_text="", blocks=[], confidence=0.1, provider=self.name)

        idx = int(digest[:8], 16) % len(keys) if digest else 0
        text = self._fixtures[keys[idx]]
        return OCRResult(
            raw_text=text,
            blocks=[line for line in text.splitlines() if line.strip()],
            confidence=0.92,
            provider=self.name,
        )
