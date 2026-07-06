"""Comprehensive backend API test suite for Soula Paws.
Tests all auth, CRUD, workflow, voice, agent, and admin endpoints.
"""
import requests
import sys
import time
from datetime import datetime

BASE_URL = "https://doc-driven-build-11.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class APITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.admin_token = None
        self.owner_token = None
        self.caregiver_token = None
        self.new_user_token = None
        self.seed_pet_id = None
        self.test_pet_id = None
        self.failed_tests = []

    def log(self, message, color=Colors.BLUE):
        print(f"{color}{message}{Colors.END}")

    def test(self, name, method, endpoint, expected_status, data=None, token=None, headers=None, timeout=30):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if token:
            req_headers['Authorization'] = f'Bearer {token}'
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        self.log(f"\n[{self.tests_run}] Testing: {name}", Colors.BLUE)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=timeout)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=req_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASS - Status: {response.status_code}", Colors.GREEN)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.tests_failed += 1
                self.log(f"❌ FAIL - Expected {expected_status}, got {response.status_code}", Colors.RED)
                try:
                    self.log(f"Response: {response.json()}", Colors.RED)
                except:
                    self.log(f"Response: {response.text[:200]}", Colors.RED)
                self.failed_tests.append(f"{name} (expected {expected_status}, got {response.status_code})")
                return False, {}

        except Exception as e:
            self.tests_failed += 1
            self.log(f"❌ FAIL - Error: {str(e)}", Colors.RED)
            self.failed_tests.append(f"{name} (error: {str(e)})")
            return False, {}

    def run_all_tests(self):
        self.log("\n" + "="*80, Colors.YELLOW)
        self.log("SOULA PAWS BACKEND API TEST SUITE", Colors.YELLOW)
        self.log("="*80 + "\n", Colors.YELLOW)

        # ============ AUTH TESTS ============
        self.log("\n### AUTH ENDPOINTS ###", Colors.YELLOW)
        
        # Test login with seed accounts
        success, resp = self.test("Login as admin", "POST", "/auth/login", 200, 
            {"email": "admin@soulapaws.local", "password": "Admin123!"})
        if success:
            self.admin_token = resp.get("token")
            
        success, resp = self.test("Login as owner", "POST", "/auth/login", 200,
            {"email": "owner@soulapaws.local", "password": "Owner123!"})
        if success:
            self.owner_token = resp.get("token")
            
        success, resp = self.test("Login as caregiver", "POST", "/auth/login", 200,
            {"email": "caregiver@soulapaws.local", "password": "Caregiver123!"})
        if success:
            self.caregiver_token = resp.get("token")

        # Test /auth/me
        self.test("Get current user (owner)", "GET", "/auth/me", 200, token=self.owner_token)
        
        # Test register new user
        timestamp = int(time.time())
        new_email = f"testuser{timestamp}@test.local"
        success, resp = self.test("Register new user", "POST", "/auth/register", 200,
            {"email": new_email, "password": "Test123!", "name": "Test User"})
        if success:
            self.new_user_token = resp.get("token")
        
        # Test forgot password
        success, resp = self.test("Forgot password", "POST", "/auth/forgot-password", 200,
            {"email": "owner@soulapaws.local"})
        reset_token = None
        if success:
            reset_token = resp.get("devResetToken")
            
        # Test reset password
        if reset_token:
            self.test("Reset password", "POST", "/auth/reset-password", 200,
                {"token": reset_token, "password": "NewPassword123!"})
            # Login with new password
            success, resp = self.test("Login with new password", "POST", "/auth/login", 200,
                {"email": "owner@soulapaws.local", "password": "NewPassword123!"})
            if success:
                self.owner_token = resp.get("token")
        
        # Test change password
        self.test("Change password", "POST", "/auth/change-password", 200,
            {"currentPassword": "NewPassword123!", "newPassword": "Owner123!"},
            token=self.owner_token)
        # Login with changed password
        success, resp = self.test("Login after password change", "POST", "/auth/login", 200,
            {"email": "owner@soulapaws.local", "password": "Owner123!"})
        if success:
            self.owner_token = resp.get("token")

        # ============ CRUD TESTS ============
        self.log("\n### CRUD ENDPOINTS ###", Colors.YELLOW)
        
        # Get pet profiles (should have seed pet 'Milo')
        success, resp = self.test("List pet profiles (owner)", "GET", "/pet-profiles", 200, 
            token=self.owner_token)
        if success and isinstance(resp, list) and len(resp) > 0:
            self.seed_pet_id = resp[0]["id"]
            self.log(f"Found seed pet: {self.seed_pet_id}", Colors.GREEN)
        elif success and isinstance(resp, dict) and resp.get("items"):
            self.seed_pet_id = resp["items"][0]["id"]
            self.log(f"Found seed pet: {self.seed_pet_id}", Colors.GREEN)
        
        # Create new pet
        success, resp = self.test("Create pet profile", "POST", "/pet-profiles", 201,
            {"name": "TestPet", "species": "dog", "breed": "Labrador", "status": "alive"},
            token=self.owner_token)
        if success:
            self.test_pet_id = resp.get("id")
        
        # Get single pet
        if self.test_pet_id:
            self.test("Get pet profile", "GET", f"/pet-profiles/{self.test_pet_id}", 200,
                token=self.owner_token)
        
        # Update pet
        if self.test_pet_id:
            self.test("Update pet profile", "PATCH", f"/pet-profiles/{self.test_pet_id}", 200,
                {"breed": "Golden Retriever"}, token=self.owner_token)
        
        # Test ownership isolation - new user shouldn't see owner's pets
        self.test("Ownership isolation - new user can't see owner's pets", "GET", 
            f"/pet-profiles/{self.seed_pet_id}", 404, token=self.new_user_token)
        
        # Create human profile
        success, resp = self.test("Create human profile", "POST", "/human-profiles", 201,
            {"displayName": "Test Human", "relationship": "owner"}, token=self.owner_token)
        human_id = resp.get("id") if success else None
        
        # Create daily check-in
        success, resp = self.test("Create daily check-in", "POST", "/daily-checkins", 201,
            {"petId": self.seed_pet_id, "date": "2025-08-15", "humanMood": "calm", 
             "petMood": "playful", "connectionQuality": 8, "stressLevel": 3},
            token=self.owner_token)
        checkin_id = resp.get("id") if success else None
        
        # Create wellness log
        success, resp = self.test("Create wellness log", "POST", "/wellness-logs", 201,
            {"petId": self.seed_pet_id, "date": "2025-08-15", "appetite": 9, 
             "energy": 8, "sleep": 7, "anxiety": 2, "bathroom": "normal"},
            token=self.owner_token)
        wellness_id = resp.get("id") if success else None
        
        # Create ritual
        success, resp = self.test("Create ritual", "POST", "/rituals", 201,
            {"petId": self.seed_pet_id, "title": "Morning Walk", "description": "Daily morning walk",
             "steps": [{"order": 1, "instruction": "Get leash", "duration": 60}]},
            token=self.owner_token)
        ritual_id = resp.get("id") if success else None
        
        # Create ritual completion
        if ritual_id:
            success, resp = self.test("Create ritual completion", "POST", "/ritual-completions", 201,
                {"ritualId": ritual_id, "petId": self.seed_pet_id, "result": "completed",
                 "petResponse": "engaged", "emotionalResult": "calm"},
                token=self.owner_token)
        
        # Create relationship pod
        success, resp = self.test("Create relationship pod", "POST", "/relationship-pods", 201,
            {"name": "My Pod", "mode": "family", "petIds": [self.seed_pet_id]}, token=self.owner_token)
        pod_id = resp.get("id") if success else None
        
        # Create care circle member
        success, resp = self.test("Create care circle member", "POST", "/care-circle-members", 201,
            {"petId": self.seed_pet_id, "name": "Vet Smith", "role": "veterinarian",
             "email": "vet@example.com"}, token=self.owner_token)
        
        # Create consent record
        success, resp = self.test("Create consent record", "POST", "/consent-records", 201,
            {"consentType": "report_sharing", "granted": True}, token=self.owner_token)
        consent_id = resp.get("id") if success else None
        
        # List notifications
        self.test("List notifications", "GET", "/notifications", 200, token=self.owner_token)
        
        # Create notification
        success, resp = self.test("Create notification", "POST", "/notifications", 201,
            {"title": "Test", "body": "Test notification"}, token=self.owner_token)
        notif_id = resp.get("id") if success else None
        
        # Mark notification as read
        if notif_id:
            self.test("Mark notification as read", "PATCH", f"/notifications/{notif_id}", 200,
                {"readAt": datetime.utcnow().isoformat()}, token=self.owner_token)
        
        # Soft delete
        if checkin_id:
            self.test("Soft delete check-in", "DELETE", f"/daily-checkins/{checkin_id}", 200,
                token=self.owner_token)

        # ============ WORKFLOW TESTS ============
        self.log("\n### WORKFLOW ENDPOINTS ###", Colors.YELLOW)
        
        # Calculate bond score
        if self.seed_pet_id:
            success, resp = self.test("Calculate bond score", "POST", "/bond-scores/calculate", 200,
                {"petId": self.seed_pet_id}, token=self.owner_token, timeout=30)
            if success:
                score = resp.get("score")
                self.log(f"Bond score: {score}/100", Colors.GREEN)
        
        # Generate relationship insight
        if self.seed_pet_id:
            success, resp = self.test("Generate relationship insight", "POST", 
                "/intelligence/relationship-insight", 200,
                {"petId": self.seed_pet_id}, token=self.owner_token, timeout=30)
            if success:
                dimensions = resp.get("dimensions", {})
                self.log(f"Intelligence dimensions: {dimensions}", Colors.GREEN)
        
        # Generate AI ritual (LLM call - allow 30s)
        if self.seed_pet_id:
            success, resp = self.test("Generate AI ritual", "POST", "/ai/generate-ritual", 200,
                {"petId": self.seed_pet_id, "goal": "bonding", "duration": 5},
                token=self.owner_token, timeout=45)
            if success:
                self.log(f"Generated ritual: {resp.get('title')}", Colors.GREEN)
        
        # AI chat (SSE streaming - we'll just check it starts)
        self.log("\n[INFO] Skipping AI chat SSE streaming test (requires SSE client)", Colors.YELLOW)
        
        # Generate report (LLM call - allow 60s)
        if self.seed_pet_id:
            success, resp = self.test("Generate vet_ready report", "POST", "/reports/generate", 200,
                {"petId": self.seed_pet_id, "type": "vet_ready"}, 
                token=self.owner_token, timeout=60)
            report_id = resp.get("id") if success else None
            
            # Try to share without consent (should fail if consent not granted)
            if report_id:
                # First, remove consent if exists
                if consent_id:
                    self.test("Delete consent record", "DELETE", f"/consent-records/{consent_id}", 200,
                        token=self.owner_token)
                
                # Try to share without consent
                self.test("Share report without consent (should fail)", "POST", 
                    f"/reports/{report_id}/share", 403,
                    {"sharedWith": "test@example.com"}, token=self.owner_token)
                
                # Create consent and share again
                success, resp = self.test("Create report_sharing consent", "POST", "/consent-records", 201,
                    {"consentType": "report_sharing", "granted": True}, token=self.owner_token)
                
                self.test("Share report with consent", "POST", f"/reports/{report_id}/share", 200,
                    {"sharedWith": "test@example.com"}, token=self.owner_token)

        # ============ VOICE TESTS ============
        self.log("\n### VOICE ENDPOINTS ###", Colors.YELLOW)
        
        # Voice message - emergency escalation
        success, resp = self.test("Voice message - emergency escalation", "POST", "/voice/message", 200,
            {"message": "my dog is having a seizure", "mode": "text"},
            token=self.owner_token, timeout=45)
        if success:
            escalation = resp.get("escalation")
            if escalation:
                self.log(f"Escalation: {escalation.get('category')} - {escalation.get('urgency')}", Colors.GREEN)
        
        # Voice message - billing escalation
        success, resp = self.test("Voice message - billing escalation", "POST", "/voice/message", 200,
            {"message": "I want a refund", "mode": "text"},
            token=self.owner_token, timeout=45)
        
        # Voice message - normal KB-grounded reply
        success, resp = self.test("Voice message - normal KB reply", "POST", "/voice/message", 200,
            {"message": "how does bond score work", "mode": "text"},
            token=self.owner_token, timeout=45)
        if success:
            answer = resp.get("answer", "")
            self.log(f"Answer preview: {answer[:100]}...", Colors.GREEN)
        
        # Get voice conversations
        self.test("Get voice conversations", "GET", "/voice/conversations", 200,
            token=self.owner_token)

        # ============ AGENT TESTS ============
        self.log("\n### AGENT ENDPOINTS ###", Colors.YELLOW)
        
        # Get agent registry
        success, resp = self.test("Get agent registry", "GET", "/agents/registry", 200,
            token=self.owner_token)
        if success:
            agents = resp if isinstance(resp, list) else resp.get("items", [])
            self.log(f"Found {len(agents)} agents", Colors.GREEN)
        
        # Run low-risk agent (data_analyst)
        success, resp = self.test("Run low-risk agent (data_analyst)", "POST", "/agents/run", 200,
            {"agentKey": "data_analyst", "title": "Test analysis", 
             "prompt": "Analyze recent check-ins"}, token=self.owner_token, timeout=45)
        if success:
            task_status = resp.get("task", {}).get("status")
            self.log(f"Task status: {task_status}", Colors.GREEN)
        
        # Run high-risk agent (safety)
        success, resp = self.test("Run high-risk agent (safety)", "POST", "/agents/run", 200,
            {"agentKey": "safety", "title": "Safety check", 
             "prompt": "Review safety protocols"}, token=self.owner_token, timeout=45)
        approval_id = None
        if success:
            approval = resp.get("approval")
            if approval:
                approval_id = approval.get("id")
                self.log(f"Approval needed: {approval_id}", Colors.GREEN)
        
        # Approve agent run
        if approval_id:
            self.test("Approve agent run", "POST", f"/agents/approvals/{approval_id}/decide", 200,
                {"status": "approved", "reason": "Test approval"}, token=self.owner_token)
        
        # Get agent runs (admin only)
        self.test("Get agent runs as owner (should fail)", "GET", "/agents/runs", 403,
            token=self.owner_token)
        
        self.test("Get agent runs as admin", "GET", "/agents/runs", 200,
            token=self.admin_token)

        # ============ ADMIN TESTS ============
        self.log("\n### ADMIN ENDPOINTS ###", Colors.YELLOW)
        
        # Admin metrics
        self.test("Get admin metrics", "GET", "/admin/metrics", 200, token=self.admin_token)
        
        # Admin users
        success, resp = self.test("Get admin users", "GET", "/admin/users", 200, 
            token=self.admin_token)
        test_user_id = None
        if success:
            users = resp if isinstance(resp, list) else resp.get("items", [])
            for user in users:
                if user.get("email") == new_email:
                    test_user_id = user.get("id")
                    break
        
        # Update user (change role, disable)
        if test_user_id:
            self.test("Update user role", "PATCH", f"/admin/users/{test_user_id}", 200,
                {"role": "caregiver"}, token=self.admin_token)
            
            self.test("Disable user", "PATCH", f"/admin/users/{test_user_id}", 200,
                {"isActive": False}, token=self.admin_token)
        
        # Admin escalations
        self.test("Get admin escalations", "GET", "/admin/escalations", 200, 
            token=self.admin_token)
        
        # Admin system health
        self.test("Get system health", "GET", "/admin/system-health", 200, 
            token=self.admin_token)
        
        # Audit logs (admin only)
        self.test("Get audit logs as owner (should fail)", "GET", "/audit-logs", 403,
            token=self.owner_token)
        
        self.test("Get audit logs as admin", "GET", "/audit-logs", 200,
            token=self.admin_token)
        
        # Admin tickets
        success, resp = self.test("Get support tickets", "GET", "/support-tickets", 200,
            token=self.admin_token)
        ticket_id = None
        if success:
            tickets = resp if isinstance(resp, list) else resp.get("items", [])
            if tickets:
                ticket_id = tickets[0].get("id")
        
        if ticket_id:
            self.test("Update ticket status", "PATCH", f"/admin/tickets/{ticket_id}", 200,
                {"status": "resolved"}, token=self.admin_token)

        # ============ SUMMARY ============
        self.log("\n" + "="*80, Colors.YELLOW)
        self.log("TEST SUMMARY", Colors.YELLOW)
        self.log("="*80, Colors.YELLOW)
        self.log(f"Total tests: {self.tests_run}", Colors.BLUE)
        self.log(f"Passed: {self.tests_passed}", Colors.GREEN)
        self.log(f"Failed: {self.tests_failed}", Colors.RED)
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%", Colors.BLUE)
        
        if self.failed_tests:
            self.log("\nFailed tests:", Colors.RED)
            for test in self.failed_tests:
                self.log(f"  - {test}", Colors.RED)
        
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = APITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
