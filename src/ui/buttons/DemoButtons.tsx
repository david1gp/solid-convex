import { mdiBell } from "@adaptive-ds/mdi/mdiBell.js"
import { mdiCheck } from "@adaptive-ds/mdi/mdiCheck.js"
import { mdiCodeBraces } from "@adaptive-ds/mdi/mdiCodeBraces.js"
import { mdiCodeJson } from "@adaptive-ds/mdi/mdiCodeJson.js"
import { mdiDownload } from "@adaptive-ds/mdi/mdiDownload.js"
import { mdiHeart } from "@adaptive-ds/mdi/mdiHeart.js"
import { mdiInformationOutline } from "@adaptive-ds/mdi/mdiInformationOutline.js"
import { mdiLoading } from "@adaptive-ds/mdi/mdiLoading.js"
import { mdiStar } from "@adaptive-ds/mdi/mdiStar.js"
import { mdiTestTube } from "@adaptive-ds/mdi/mdiTestTube.js"
import { mdiTestTubeEmpty } from "@adaptive-ds/mdi/mdiTestTubeEmpty.js"
import { createSignal, For } from "solid-js"
import { Button } from "#ui/interactive/button/Button.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { CorvuDialog } from "#ui/interactive/dialog/CorvuDialog.jsx"
import { LinkButtonExternal, LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { LinkButtonIconOnlyExternal } from "#ui/interactive/link/LinkButtonIconOnly.jsx"
import { CorvuPopover } from "#ui/interactive/popover/CorvuPopover.jsx"
import { CorvuPopoverIcon } from "#ui/interactive/popover/CorvuPopoverIcon.jsx"
import { InfoPopover } from "#ui/interactive/popover/InfoPopover.jsx"
import { ToggleButton } from "#ui/interactive/toggle/ToggleButton.jsx"
import { ToggleButtonIconOnly } from "#ui/interactive/toggle/ToggleButtonIconOnly.jsx"
import { createSignalObject } from "#ui/utils/createSignalObject.js"

/**
 * Buttons demo on the uniform button size (no `size` prop anywhere).
 * Wired into the demos catalog via `demoList` (`/demos/ui/DemoButtons`).
 */
export function DemoButtons() {
  return (
    <div class="p-4">
      <h1 class="mb-6 text-3xl font-bold">Buttons Demo</h1>
      <div class="space-y-8">
        <ButtonVariantsDemo />
        <ButtonIconComponentsDemo />
        <ButtonIconDemo />
        <ButtonIconOnlyDemo />
        <ButtonStatesDemo />
        <ToggleButtonsDemo />
        <LinkButtonsDemo />
        <PopoverDialogDemo />
      </div>
    </div>
  )
}

function ButtonVariantsDemo() {
  const variants = Object.values(buttonVariant)

  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">Button Variants</h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <For each={variants}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
      </div>
    </div>
  )
}

function ButtonIconComponentsDemo() {
  const variants = Object.values(buttonVariant)
  const icons = [mdiHeart, mdiStar, mdiBell, mdiCheck, mdiDownload]

  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">ButtonIcon Components</h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <For each={variants}>
          {(variant, i) => (
            <ButtonIcon icon={icons[i() % icons.length]} variant={variant}>
              {variant}
            </ButtonIcon>
          )}
        </For>
      </div>
    </div>
  )
}

function ButtonIconDemo() {
  const [isLoading, setIsLoading] = createSignal(false)
  const [clicks, setClicks] = createSignal(0)

  const handleClick = () => {
    setClicks(clicks() + 1)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">ButtonIcon Component</h2>
      <div class="flex flex-wrap items-center gap-4">
        <ButtonIcon icon={mdiHeart} onClick={handleClick}>
          Like ({clicks()})
        </ButtonIcon>
        <ButtonIcon icon={mdiLoading} isLoading={isLoading()} onClick={handleClick}>
          Save
        </ButtonIcon>
        <ButtonIcon icon={mdiHeart} iconRight={mdiHeart} variant={buttonVariant.contrast}>
          Heart
        </ButtonIcon>
      </div>
    </div>
  )
}

function ButtonIconOnlyDemo() {
  const [likes, setLikes] = createSignal(0)

  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">ButtonIconOnly Component</h2>
      <div class="flex items-center gap-4">
        <ButtonIconOnly icon={mdiHeart} title="Like" onClick={() => setLikes(likes() + 1)} />
        <ButtonIconOnly
          icon={mdiStar}
          title="Favorite"
          variant={buttonVariant.contrast}
          onClick={() => setLikes(likes() + 1)}
        />
        <span>Likes: {likes()}</span>
      </div>
    </div>
  )
}

function ButtonStatesDemo() {
  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">Button States</h2>
      <div class="flex flex-wrap gap-4">
        <Button disabled>Disabled</Button>
        <Button variant={buttonVariant.contrast} disabled>
          Disabled Primary
        </Button>
        <ButtonIcon isLoading icon={mdiLoading}>
          Loading
        </ButtonIcon>
        <ButtonIconOnly icon={mdiHeart} title="Disabled Icon" isLoading />
      </div>
    </div>
  )
}

function ToggleButtonsDemo() {
  const inDevModeSignal = createSignalObject(false)
  const inTestModeSignal = createSignalObject(false)

  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">Toggle Buttons</h2>
      <div class="space-y-6">
        <div>
          <h3 class="mb-3 text-xl font-semibold">ToggleButton</h3>
          <div class="flex flex-wrap gap-4">
            <ToggleButton
              title={inDevModeSignal.get() ? "Dev Mode Active" : "Dev Mode Disabled"}
              pressedSignal={inDevModeSignal}
            >
              {inDevModeSignal.get() ? "Dev Mode: ON" : "Dev Mode: OFF"}
            </ToggleButton>
            <ToggleButton
              title={inTestModeSignal.get() ? "Test Mode Active" : "Test Mode Disabled"}
              pressedSignal={inTestModeSignal}
            >
              {inTestModeSignal.get() ? "Test Mode: ON" : "Test Mode: OFF"}
            </ToggleButton>
          </div>
        </div>
        <div>
          <h3 class="mb-3 text-xl font-semibold">ToggleButtonIconOnly</h3>
          <div class="flex gap-4">
            <ToggleButtonIconOnly
              title={"Dev Mode: " + (inDevModeSignal.get() ? "Active" : "Disabled")}
              pressedSignal={inDevModeSignal}
              icon={inDevModeSignal.get() ? mdiCodeJson : mdiCodeBraces}
            />
            <ToggleButtonIconOnly
              title={"Test Mode: " + (inTestModeSignal.get() ? "Active" : "Disabled")}
              pressedSignal={inTestModeSignal}
              icon={inTestModeSignal.get() ? mdiTestTube : mdiTestTubeEmpty}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkButtonsDemo() {
  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">Link Buttons</h2>
      <div class="flex flex-wrap items-center gap-4">
        <LinkButtonInternal to="/demos" variant={buttonVariant.contrast}>
          All demos
        </LinkButtonInternal>
        <LinkButtonExternal href="https://example.com" variant={buttonVariant.outline} icon={mdiDownload}>
          Download
        </LinkButtonExternal>
        <LinkButtonIconOnlyExternal
          href="https://example.com"
          title="Example"
          variant={buttonVariant.ghost}
          icon={mdiHeart}
        />
      </div>
    </div>
  )
}

function PopoverDialogDemo() {
  return (
    <div>
      <h2 class="mb-4 text-2xl font-bold">Popover and Dialog Triggers</h2>
      <div class="flex flex-wrap items-center gap-4">
        <CorvuPopover icon={mdiInformationOutline} variant={buttonVariant.outline} buttonChildren="More">
          <p>Popover content on a uniform button trigger.</p>
        </CorvuPopover>
        <InfoPopover>
          <p>Help content anchored to the info icon trigger.</p>
        </InfoPopover>
        <CorvuPopoverIcon icon={mdiInformationOutline} title="Icon popover">
          <p>Popover content on an icon-only trigger.</p>
        </CorvuPopoverIcon>
        <CorvuDialog
          icon={mdiInformationOutline}
          variant={buttonVariant.outline}
          buttonChildren="Details"
          title="Details dialog"
        >
          <p>Dialog content on a uniform button trigger.</p>
        </CorvuDialog>
      </div>
    </div>
  )
}
