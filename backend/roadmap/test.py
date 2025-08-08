from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

class RoadmapGenerateTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_no_topic_provided(self):
        response = self.client.get('/roadmap/generate/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
