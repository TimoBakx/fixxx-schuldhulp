<?php
namespace GemeenteAmsterdam\FixxxSchuldhulp\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Security;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Session\SessionInterface;


/**
 * @Route("/app/release-notes")
 * @Security("has_role('ROLE_USER')")
 */
class UserReleaseNotesController extends Controller
{
    private $session;

    public function __construct(SessionInterface $session)
    {
        $this->session = $session;
    }
    /**
     * @Route("/")
     * @Security("has_role('ROLE_USER')")
     */
    public function indexAction(Request $request)
    {
        $finder = new Finder();
        $finder->files()->in($this->get('kernel')->getRootDir() . '/../templates/UserReleaseNotes/releases');

        $templates = [];

        foreach ($finder as $file) {
            array_push($templates, $file->getRelativePathname());
        }
        return $this->render('UserReleaseNotes/index.html.twig', ['templates' => $templates]);
    }
    /**
     * @Route("/seen")
     * @Security("has_role('ROLE_USER')")
     */
    public function releaseNoteSeenAction(Request $request)
    {

//        $seenReleaseNotes = $request->getSession()->get('seenReleaseNotes');
        $seenReleaseNotes = $this->session->get('seenReleaseNotes');
        $seenReleaseNotes["ts" . $request->query->get('ts')] = 0;


        return new JsonResponse($this->get('json_serializer')->normalize([
            'ts' => $request->query->get('ts'),
            'user' => $this->getUser(),
            'rn' => $seenReleaseNotes,
        ]));
    }
}