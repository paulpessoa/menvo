import { toPlainText } from "./plain-text"

describe("toPlainText", () => {
  it("strips tags and keeps block boundaries as line breaks", () => {
    expect(toPlainText("<div>Olá</div><div>Tudo bem?</div>")).toBe("Olá\nTudo bem?")
  })

  it("decodes common entities", () => {
    expect(toPlainText("A&nbsp;&amp;&nbsp;B")).toBe("A & B")
  })

  it("removes tags that were escaped twice", () => {
    expect(toPlainText("Oi &lt;span style=&quot;x&quot;&gt;mundo&lt;/span&gt;")).toBe("Oi mundo")
  })

  it("leaves plain text untouched", () => {
    expect(toPlainText("Sou dev, 25 anos.\n\nGosto de React.")).toBe("Sou dev, 25 anos.\n\nGosto de React.")
  })
})
