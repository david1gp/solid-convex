import { expect, test } from "bun:test"
import * as a from "valibot"
import { googleOauthTokenSchema } from "#src/auth/server/social_identity_providers/getGoogleOauthToken.ts"

test("parses a Google OAuth token response", () => {
  const example = `

{
  "access_token": "ya29.a0AS3H6NwKg-sok0VnQ29X98tfmA4O4wdvGD8QuE1FLNRgpelzQuFktnudAsBFpHqHAf3uc9IYL1F6HHEVVRk3QcbuOhbb24ctQx8VPWBrgiZMrfR3QSkZ8c6QtdqKcWFO9Q060mMxCOkcUuoUeMy5r4jaKXKeuj9Uh8Cc6FMSWLroWz3w__XPY4jo8atKjdA5fykT6yIaCgYKAf4SARISFQHGX2Mi_VNWjcPPDM-Wvv-qL6cJng0206",
  "expires_in": 3599,
  "refresh_token": "1//030fuB5pk1KQrCgYIARAAGAMSNwF-L9Irpbn3k8dlsBp6uy5vDQL4xxGkPEHWMCq7bML4MF3mPt3ge7dr0C9qHi6zyVhlyWuMEes",
  "scope": "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjljNjI1MTU4Nzk1MDg0NGE2NTZiZTM1NjNkOGM1YmQ2Zjg5NGM0MDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNzc3NzAwNTAyODQtNmdoMDdnNGs5MWQ4YjhxODduMWhpYWJzbTNodGRiYXMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzNzc3NzAwNTAyODQtNmdoMDdnNGs5MWQ4YjhxODduMWhpYWJzbTNodGRiYXMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTU2MTkzMzUyODY2NTU5MzIzOTciLCJlbWFpbCI6ImFkYXB0aXZlLnNoaWVsZC5tYXRyaXhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJXNGpXeWRDb0tCWkFHODdkRkxoWUpnIiwibmFtZSI6IkFkYXB0aXZlIFNoaWVsZCBNYXRyaXgiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWppZmh3N2lWX0dNV2xsSm9vbkVwRGZlSFQ0aHVrQ0UyMWNIQXdBMG92RTF5bXlyVT1zOTYtYyIsImdpdmVuX25hbWUiOiJBZGFwdGl2ZSBTaGllbGQgTWF0cml4IiwiaWF0IjoxNzU3Njc4NTExLCJleHAiOjE3NTc2ODIxMTF9.2Z1Flq1vEigH1WrKf7P8oYRsb0MVPYPAt0KFsmYI-vqLSADt9mVIGvwSz6GLfDrIlOqqT2gbY5ctEUBfeqrrqdv2Qu5EVN8tbApyBxfxROFj6ptgOjltmCD_EU5UXnrur2NAojhho3vrcIIHC-8dKJaJW1zdQuHCgL3xcsxlnrlhi0KKMbYbJq3h_2iR--11cMiR8hMQeboQN8yAYWXqA7TNWNda4BW3_E-Nt8fK9ZLH3t5a3_H3lI4Q5apR41-6mTeRQrPrrKWl-6R-SgWM0XG3kJAaTfDAXwsKhPiyzO7tBPFYEMneleHCsQXzIg-oGb9jkCpCymgXMHE38xELig"
}

`
  const schema = a.pipe(a.string(), a.parseJson(), googleOauthTokenSchema)
  const p = a.safeParse(schema, example)
  if (!p.success) {
    console.log(a.summarize(p.issues))
    console.log(p.issues)
  }
  expect(p.success).toBe(true)
  if (p.success) {
    expect(p.output.expires_in).toBe(3599)
  }
})
