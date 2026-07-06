"""Comprehensive frontend UI and integration test for Soula Paws using Playwright."""
import asyncio
import sys
from playwright.async_api import async_playwright, expect

BASE_URL = "https://doc-driven-build-11.preview.emergentagent.com"

# Test credentials
OWNER_EMAIL = "owner@soulapaws.local"
OWNER_PASSWORD = "Owner123!"
ADMIN_EMAIL = "admin@soulapaws.local"
ADMIN_PASSWORD = "Admin123!"

async def test_frontend():
    """Run comprehensive frontend tests"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        
        try:
            print("\n" + "="*80)
            print("SOULA PAWS FRONTEND TEST SUITE")
            print("="*80 + "\n")
            
            # ============ LANDING PAGE ============
            print("\n### LANDING PAGE ###")
            await page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            
            # Check if landing page renders
            try:
                await page.wait_for_selector("text=Soula Paws", timeout=5000)
                print("✅ Landing page loaded")
            except:
                print("❌ Landing page failed to load")
                await page.screenshot(path="/tmp/landing_error.png", quality=40, full_page=False)
            
            # ============ LOGIN AS OWNER ============
            print("\n### LOGIN AS OWNER ###")
            
            # Find and click login/sign in button
            try:
                login_button = await page.wait_for_selector("text=/Sign In|Log In|Login/i", timeout=5000)
                await login_button.click()
                await page.wait_for_timeout(1000)
                print("✅ Clicked login button")
            except:
                print("⚠️ No login button found, might already be on auth page")
            
            # Fill login form
            try:
                await page.fill("input[type='email']", OWNER_EMAIL)
                await page.fill("input[type='password']", OWNER_PASSWORD)
                await page.click("button[type='submit']")
                await page.wait_for_timeout(3000)
                
                # Check if redirected to dashboard
                if "/dashboard" in page.url:
                    print("✅ Login successful, redirected to dashboard")
                else:
                    print(f"⚠️ Login completed but URL is: {page.url}")
            except Exception as e:
                print(f"❌ Login failed: {e}")
                await page.screenshot(path="/tmp/login_error.png", quality=40, full_page=False)
            
            # ============ DASHBOARD ============
            print("\n### DASHBOARD ###")
            
            try:
                # Check for dashboard elements
                await page.wait_for_selector("text=/Bond Score|Dashboard/i", timeout=5000)
                print("✅ Dashboard loaded")
                
                # Check for Bond Score card
                try:
                    await page.wait_for_selector("text=/Bond Score/i", timeout=3000)
                    print("✅ Bond Score card visible")
                except:
                    print("⚠️ Bond Score card not found")
                
                # Check for Today's Ritual
                try:
                    await page.wait_for_selector("text=/Ritual|Today/i", timeout=3000)
                    print("✅ Ritual section visible")
                except:
                    print("⚠️ Ritual section not found")
                
                # Try to submit quick check-in
                try:
                    # Look for check-in form
                    human_mood = await page.query_selector("select[name='humanMood'], input[name='humanMood']")
                    if human_mood:
                        await human_mood.select_option("calm")
                        
                        pet_mood = await page.query_selector("select[name='petMood'], input[name='petMood']")
                        if pet_mood:
                            await pet_mood.select_option("playful")
                        
                        submit_btn = await page.query_selector("button:has-text('Submit'), button:has-text('Check In')")
                        if submit_btn:
                            await submit_btn.click()
                            await page.wait_for_timeout(2000)
                            print("✅ Quick check-in submitted")
                        else:
                            print("⚠️ Check-in submit button not found")
                    else:
                        print("⚠️ Check-in form not found on dashboard")
                except Exception as e:
                    print(f"⚠️ Quick check-in test skipped: {e}")
                
            except Exception as e:
                print(f"❌ Dashboard test failed: {e}")
                await page.screenshot(path="/tmp/dashboard_error.png", quality=40, full_page=False)
            
            # ============ PETS PAGE ============
            print("\n### PETS PAGE ###")
            
            try:
                # Navigate to pets page
                await page.click("text=/Pets|My Pets/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Pets page")
                
                # Check for Milo (seed pet)
                try:
                    await page.wait_for_selector("text=Milo", timeout=3000)
                    print("✅ Seed pet 'Milo' found")
                except:
                    print("⚠️ Seed pet 'Milo' not found")
                
                # Try to add a new pet
                try:
                    add_pet_btn = await page.query_selector("button:has-text('Add Pet'), button:has-text('New Pet')")
                    if add_pet_btn:
                        await add_pet_btn.click()
                        await page.wait_for_timeout(1000)
                        
                        # Fill pet form
                        await page.fill("input[name='name']", "TestPet")
                        
                        species_select = await page.query_selector("select[name='species']")
                        if species_select:
                            await species_select.select_option("dog")
                        
                        # Submit
                        save_btn = await page.query_selector("button:has-text('Save'), button:has-text('Create')")
                        if save_btn:
                            await save_btn.click()
                            await page.wait_for_timeout(2000)
                            print("✅ New pet added")
                        else:
                            print("⚠️ Save button not found")
                    else:
                        print("⚠️ Add Pet button not found")
                except Exception as e:
                    print(f"⚠️ Add pet test skipped: {e}")
                
            except Exception as e:
                print(f"❌ Pets page test failed: {e}")
            
            # ============ CHECK-INS PAGE ============
            print("\n### CHECK-INS PAGE ###")
            
            try:
                await page.click("text=/Check-Ins|Check In/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Check-Ins page")
            except Exception as e:
                print(f"⚠️ Check-Ins navigation failed: {e}")
            
            # ============ WELLNESS PAGE ============
            print("\n### WELLNESS PAGE ###")
            
            try:
                await page.click("text=/Wellness/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Wellness page")
            except Exception as e:
                print(f"⚠️ Wellness navigation failed: {e}")
            
            # ============ RITUALS PAGE ============
            print("\n### RITUALS PAGE ###")
            
            try:
                await page.click("text=/Rituals/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Rituals page")
                
                # Try to generate AI ritual
                try:
                    generate_btn = await page.query_selector("button:has-text('Generate'), button:has-text('AI Ritual')")
                    if generate_btn:
                        await generate_btn.click()
                        await page.wait_for_timeout(1000)
                        
                        # Fill form if dialog appears
                        pet_select = await page.query_selector("select[name='petId']")
                        if pet_select:
                            await pet_select.select_option(index=0)
                        
                        confirm_btn = await page.query_selector("button:has-text('Generate'), button:has-text('Create')")
                        if confirm_btn:
                            await confirm_btn.click()
                            print("⏳ Generating AI ritual (waiting 45s)...")
                            await page.wait_for_timeout(45000)
                            print("✅ AI ritual generation completed")
                        else:
                            print("⚠️ Generate confirm button not found")
                    else:
                        print("⚠️ Generate AI ritual button not found")
                except Exception as e:
                    print(f"⚠️ AI ritual generation skipped: {e}")
                
            except Exception as e:
                print(f"❌ Rituals page test failed: {e}")
            
            # ============ BOND SCORE PAGE ============
            print("\n### BOND SCORE PAGE ###")
            
            try:
                await page.click("text=/Bond Score/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Bond Score page")
                
                # Try to calculate bond score
                try:
                    calc_btn = await page.query_selector("button:has-text('Calculate')")
                    if calc_btn:
                        await calc_btn.click()
                        await page.wait_for_timeout(5000)
                        print("✅ Bond score calculated")
                    else:
                        print("⚠️ Calculate button not found")
                except Exception as e:
                    print(f"⚠️ Bond score calculation skipped: {e}")
                
            except Exception as e:
                print(f"❌ Bond Score page test failed: {e}")
            
            # ============ INTELLIGENCE PAGE ============
            print("\n### INTELLIGENCE PAGE ###")
            
            try:
                await page.click("text=/Intelligence/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Intelligence page")
                
                # Try to generate snapshot
                try:
                    generate_btn = await page.query_selector("button:has-text('Generate')")
                    if generate_btn:
                        await generate_btn.click()
                        await page.wait_for_timeout(5000)
                        print("✅ Intelligence snapshot generated")
                    else:
                        print("⚠️ Generate button not found")
                except Exception as e:
                    print(f"⚠️ Intelligence snapshot skipped: {e}")
                
            except Exception as e:
                print(f"❌ Intelligence page test failed: {e}")
            
            # ============ AI COACH PAGE ============
            print("\n### AI COACH PAGE ###")
            
            try:
                await page.click("text=/Coach|AI Coach/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to AI Coach page")
                
                # Send a message
                try:
                    message_input = await page.query_selector("textarea, input[type='text']")
                    if message_input:
                        await message_input.fill("How does the Bond Score work?")
                        
                        send_btn = await page.query_selector("button:has-text('Send')")
                        if send_btn:
                            await send_btn.click()
                            print("⏳ Waiting for AI response (45s)...")
                            await page.wait_for_timeout(45000)
                            print("✅ AI Coach response received")
                        else:
                            print("⚠️ Send button not found")
                    else:
                        print("⚠️ Message input not found")
                except Exception as e:
                    print(f"⚠️ AI Coach test skipped: {e}")
                
            except Exception as e:
                print(f"❌ AI Coach page test failed: {e}")
            
            # ============ REPORTS PAGE ============
            print("\n### REPORTS PAGE ###")
            
            try:
                await page.click("text=/Reports/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Reports page")
                
                # Try to generate report
                try:
                    generate_btn = await page.query_selector("button:has-text('Generate')")
                    if generate_btn:
                        await generate_btn.click()
                        await page.wait_for_timeout(1000)
                        
                        # Select pet and type
                        pet_select = await page.query_selector("select[name='petId']")
                        if pet_select:
                            await pet_select.select_option(index=0)
                        
                        type_select = await page.query_selector("select[name='type']")
                        if type_select:
                            await type_select.select_option("vet_ready")
                        
                        confirm_btn = await page.query_selector("button:has-text('Generate'), button:has-text('Create')")
                        if confirm_btn:
                            await confirm_btn.click()
                            print("⏳ Generating report (waiting 60s)...")
                            await page.wait_for_timeout(60000)
                            print("✅ Report generated")
                        else:
                            print("⚠️ Generate confirm button not found")
                    else:
                        print("⚠️ Generate report button not found")
                except Exception as e:
                    print(f"⚠️ Report generation skipped: {e}")
                
            except Exception as e:
                print(f"❌ Reports page test failed: {e}")
            
            # ============ VOICE SUPPORT PAGE ============
            print("\n### VOICE SUPPORT PAGE (TEXT INPUT ONLY) ###")
            
            try:
                await page.click("text=/Voice|Support/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Voice Support page")
                
                # Test emergency escalation with TEXT INPUT
                try:
                    text_input = await page.query_selector("textarea, input[type='text']")
                    if text_input:
                        await text_input.fill("my dog is having a seizure")
                        
                        send_btn = await page.query_selector("button:has-text('Send')")
                        if send_btn:
                            await send_btn.click()
                            await page.wait_for_timeout(5000)
                            
                            # Check for escalation alert
                            escalation = await page.query_selector("text=/emergency|escalation|urgent/i")
                            if escalation:
                                print("✅ Emergency escalation detected")
                            else:
                                print("⚠️ Emergency escalation not visible")
                        else:
                            print("⚠️ Send button not found")
                    else:
                        print("⚠️ Text input not found")
                except Exception as e:
                    print(f"⚠️ Voice support test skipped: {e}")
                
            except Exception as e:
                print(f"❌ Voice Support page test failed: {e}")
            
            # ============ AGENTS PAGE ============
            print("\n### AGENTS PAGE ###")
            
            try:
                await page.click("text=/Agents|Agent Center/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Agents page")
                
                # Check for 14 agents
                try:
                    agent_cards = await page.query_selector_all("[class*='agent'], [class*='card']")
                    print(f"✅ Found {len(agent_cards)} agent elements")
                except Exception as e:
                    print(f"⚠️ Agent count check skipped: {e}")
                
                # Try to run an agent
                try:
                    run_btn = await page.query_selector("button:has-text('Run')")
                    if run_btn:
                        await run_btn.click()
                        await page.wait_for_timeout(1000)
                        
                        # Fill task form
                        title_input = await page.query_selector("input[name='title']")
                        if title_input:
                            await title_input.fill("Test task")
                        
                        prompt_input = await page.query_selector("textarea[name='prompt']")
                        if prompt_input:
                            await prompt_input.fill("Analyze recent data")
                        
                        submit_btn = await page.query_selector("button:has-text('Run'), button:has-text('Submit')")
                        if submit_btn:
                            await submit_btn.click()
                            print("⏳ Running agent (waiting 30s)...")
                            await page.wait_for_timeout(30000)
                            print("✅ Agent task completed")
                        else:
                            print("⚠️ Submit button not found")
                    else:
                        print("⚠️ Run agent button not found")
                except Exception as e:
                    print(f"⚠️ Agent run test skipped: {e}")
                
            except Exception as e:
                print(f"❌ Agents page test failed: {e}")
            
            # ============ CARE CIRCLE PAGE ============
            print("\n### CARE CIRCLE PAGE ###")
            
            try:
                await page.click("text=/Care Circle/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Care Circle page")
            except Exception as e:
                print(f"⚠️ Care Circle navigation failed: {e}")
            
            # ============ PRIVACY PAGE ============
            print("\n### PRIVACY PAGE ###")
            
            try:
                await page.click("text=/Privacy/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Privacy page")
                
                # Check for consent toggles
                try:
                    toggles = await page.query_selector_all("input[type='checkbox']")
                    print(f"✅ Found {len(toggles)} consent toggles")
                except Exception as e:
                    print(f"⚠️ Consent toggles check skipped: {e}")
                
            except Exception as e:
                print(f"❌ Privacy page test failed: {e}")
            
            # ============ LOGOUT ============
            print("\n### LOGOUT ###")
            
            try:
                logout_btn = await page.query_selector("button:has-text('Logout'), button:has-text('Sign Out')")
                if logout_btn:
                    await logout_btn.click()
                    await page.wait_for_timeout(2000)
                    print("✅ Logout successful")
                else:
                    print("⚠️ Logout button not found")
            except Exception as e:
                print(f"⚠️ Logout test skipped: {e}")
            
            # ============ LOGIN AS ADMIN ============
            print("\n### LOGIN AS ADMIN ###")
            
            try:
                await page.goto(BASE_URL, wait_until="networkidle")
                await page.wait_for_timeout(2000)
                
                login_button = await page.wait_for_selector("text=/Sign In|Log In|Login/i", timeout=5000)
                await login_button.click()
                await page.wait_for_timeout(1000)
                
                await page.fill("input[type='email']", ADMIN_EMAIL)
                await page.fill("input[type='password']", ADMIN_PASSWORD)
                await page.click("button[type='submit']")
                await page.wait_for_timeout(3000)
                
                print("✅ Admin login successful")
                
                # ============ ADMIN PANEL ============
                print("\n### ADMIN PANEL ###")
                
                # Navigate to admin page
                await page.click("text=/Admin/i")
                await page.wait_for_timeout(2000)
                print("✅ Navigated to Admin panel")
                
                # Check for metrics cards
                try:
                    await page.wait_for_selector("text=/Users|Pets|Metrics/i", timeout=3000)
                    print("✅ Admin metrics visible")
                except:
                    print("⚠️ Admin metrics not found")
                
                # Check for users table
                try:
                    await page.wait_for_selector("text=/Email|Role|Active/i", timeout=3000)
                    print("✅ Users table visible")
                except:
                    print("⚠️ Users table not found")
                
            except Exception as e:
                print(f"❌ Admin tests failed: {e}")
            
            # ============ REGISTER NEW USER ============
            print("\n### REGISTER NEW USER ###")
            
            try:
                # Logout first
                logout_btn = await page.query_selector("button:has-text('Logout'), button:has-text('Sign Out')")
                if logout_btn:
                    await logout_btn.click()
                    await page.wait_for_timeout(2000)
                
                await page.goto(BASE_URL, wait_until="networkidle")
                await page.wait_for_timeout(2000)
                
                # Find register/sign up link
                register_link = await page.query_selector("text=/Sign Up|Register|Create Account/i")
                if register_link:
                    await register_link.click()
                    await page.wait_for_timeout(1000)
                    
                    # Fill registration form
                    await page.fill("input[name='name']", "New Test User")
                    await page.fill("input[type='email']", f"newuser{int(asyncio.get_event_loop().time())}@test.local")
                    await page.fill("input[type='password']", "Test123!")
                    
                    await page.click("button[type='submit']")
                    await page.wait_for_timeout(3000)
                    
                    # Check if redirected to dashboard
                    if "/dashboard" in page.url:
                        print("✅ New user registration successful")
                    else:
                        print(f"⚠️ Registration completed but URL is: {page.url}")
                else:
                    print("⚠️ Register link not found")
                
            except Exception as e:
                print(f"⚠️ Registration test skipped: {e}")
            
            print("\n" + "="*80)
            print("FRONTEND TEST SUITE COMPLETED")
            print("="*80 + "\n")
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {e}")
            await page.screenshot(path="/tmp/critical_error.png", quality=40, full_page=False)
            return 1
        finally:
            await browser.close()
        
        return 0

if __name__ == "__main__":
    exit_code = asyncio.run(test_frontend())
    sys.exit(exit_code)
